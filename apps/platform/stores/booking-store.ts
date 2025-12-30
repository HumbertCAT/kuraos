/**
 * Booking Store - Zustand state management for public booking wizard.
 * Persists state across wizard steps and page reloads.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookingService {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    currency: string;
    kind: 'ONE_ON_ONE' | 'GROUP';
}

export interface BookingSlot {
    start: string;
    end: string;
    spots_left: number;
}

export interface ClientDetails {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
}

interface BookingState {
    // Wizard data
    therapistId: string | null;
    service: BookingService | null;
    selectedDate: string | null;
    slot: BookingSlot | null;
    clientDetails: ClientDetails | null;
    
    // Payment flow
    bookingId: string | null;
    clientSecret: string | null;
    
    // Timezone
    clientTimezone: string;
    
    // Expiration timer (Zombie Booking prevention)
    expiresAt: number | null;  // Unix timestamp
    
    // Actions
    setTherapistId: (id: string) => void;
    setService: (service: BookingService) => void;
    setSelectedDate: (date: string) => void;
    setSlot: (slot: BookingSlot) => void;
    setClientDetails: (details: ClientDetails) => void;
    setPaymentIntent: (bookingId: string, clientSecret: string) => void;
    setExpiration: (minutes: number) => void;
    reset: () => void;
    
    // Computed
    isExpired: () => boolean;
    getRemainingSeconds: () => number;
}

const initialState = {
    therapistId: null,
    service: null,
    selectedDate: null,
    slot: null,
    clientDetails: null,
    bookingId: null,
    clientSecret: null,
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    expiresAt: null,
};

export const useBookingStore = create<BookingState>()(
    persist(
        (set, get) => ({
            ...initialState,
            
            setTherapistId: (id) => set({ therapistId: id }),
            
            setService: (service) => set({ 
                service, 
                slot: null, 
                bookingId: null, 
                clientSecret: null 
            }),
            
            setSelectedDate: (date) => set({ 
                selectedDate: date, 
                slot: null 
            }),
            
            setSlot: (slot) => set({ slot }),
            
            setClientDetails: (details) => set({ clientDetails: details }),
            
            setPaymentIntent: (bookingId, clientSecret) => set({ 
                bookingId, 
                clientSecret 
            }),
            
            setExpiration: (minutes) => set({ 
                expiresAt: Date.now() + (minutes * 60 * 1000) 
            }),
            
            reset: () => set(initialState),
            
            isExpired: () => {
                const { expiresAt } = get();
                if (!expiresAt) return false;
                return Date.now() > expiresAt;
            },
            
            getRemainingSeconds: () => {
                const { expiresAt } = get();
                if (!expiresAt) return 0;
                return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            },
        }),
        {
            name: 'kura-booking-store',
            // Only persist essential data, not computed
            partialize: (state) => ({
                therapistId: state.therapistId,
                service: state.service,
                selectedDate: state.selectedDate,
                slot: state.slot,
                clientDetails: state.clientDetails,
                bookingId: state.bookingId,
                clientSecret: state.clientSecret,
                expiresAt: state.expiresAt,
            }),
        }
    )
);
