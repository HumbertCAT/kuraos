'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary that silently catches and recovers from known React DOM errors.
 * Specifically handles the "removeChild" error that occurs during rapid re-renders
 * with components like TipTap editor.
 */
export default class SilentErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Check if it's a known benign error
        if (SilentErrorBoundary.isBenignError(error)) {
            // Don't set hasError to true - just log and continue
            console.warn('[SilentErrorBoundary] Caught benign DOM error:', error.message);
            return { hasError: false, error: null };
        }
        return { hasError: true, error };
    }

    private static isBenignError(error: Error): boolean {
        const benignMessages = [
            'removeChild',
            'insertBefore',
            'appendChild',
            'The node to be removed is not a child of this node',
        ];
        return benignMessages.some(msg => error.message?.includes(msg));
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (SilentErrorBoundary.isBenignError(error)) {
            // Silently ignore benign DOM manipulation errors
            console.warn('[SilentErrorBoundary] Ignored DOM error in:', errorInfo.componentStack);
            // Reset error state to allow continued rendering
            this.setState({ hasError: false, error: null });
            return;
        }

        // Log real errors
        console.error('[SilentErrorBoundary] Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError && this.state.error) {
            // Show fallback for real errors
            return this.props.fallback || (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="font-medium">Something went wrong</p>
                    <p className="text-sm mt-1">{this.state.error.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-2 text-sm underline"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
