import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DismissalStrategy = 'daily' | 'session' | 'permanent';

interface DismissedCard {
    id: string;
    strategy: DismissalStrategy;
    dismissedAt: string; // ISO Date
}

interface UIState {
    dismissedCardIds: Record<string, DismissedCard>;
    dismissCard: (id: string, strategy: DismissalStrategy) => void;
    isCardDismissed: (id: string) => boolean;
    _checkAndClearDaily: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            dismissedCardIds: {},

            dismissCard: (id, strategy) => {
                const now = new Date().toISOString();
                set((state) => ({
                    dismissedCardIds: {
                        ...state.dismissedCardIds,
                        [id]: { id, strategy, dismissedAt: now }
                    }
                }));
            },

            isCardDismissed: (id) => {
                const card = get().dismissedCardIds[id];
                if (!card) return false;

                if (card.strategy === 'session') {
                    // Logic for session is usually handled by not persisting it, 
                    // but since we are using 'persist', we handle it manually or skip it in storage
                    return true; 
                }

                if (card.strategy === 'daily') {
                    const today = new Date().toISOString().split('T')[0];
                    const dismissedDate = card.dismissedAt.split('T')[0];
                    return today === dismissedDate;
                }

                return true; // permanent
            },

            _checkAndClearDaily: () => {
                const { dismissedCardIds } = get();
                const today = new Date().toISOString().split('T')[0];
                let hasChanges = false;
                const newDismissed = { ...dismissedCardIds };

                Object.keys(newDismissed).forEach((id) => {
                    const card = newDismissed[id];
                    if (card.strategy === 'daily') {
                        const dismissedDate = card.dismissedAt.split('T')[0];
                        if (today !== dismissedDate) {
                            delete newDismissed[id];
                            hasChanges = true;
                        }
                    }
                });

                if (hasChanges) {
                    set({ dismissedCardIds: newDismissed });
                }
            }
        }),
        {
            name: 'kuraos-ui-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // We only persist daily and permanent. Session is handled by volatile state if we split it,
                // but for simplicity here we filter on load or just store it.
                dismissedCardIds: Object.fromEntries(
                    Object.entries(state.dismissedCardIds).filter(
                        ([, card]) => card.strategy !== 'session'
                    )
                )
            })
        }
    )
);
