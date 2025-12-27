'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * Preset focus areas for common UI elements.
 * Values are percentages: { top, left, width, height }
 */
const PRESETS: Record<string, { top: number; left: number; width: number; height: number }> = {
    // Full view (no zoom)
    'full': { top: 0, left: 0, width: 100, height: 100 },

    // Sidebar navigation
    'sidebar': { top: 0, left: 0, width: 18, height: 100 },

    // Dashboard areas
    'dashboard-header': { top: 0, left: 18, width: 60, height: 15 },
    'dashboard-grid': { top: 15, left: 18, width: 60, height: 85 },

    // Patient Profile
    'patient-hero': { top: 5, left: 20, width: 55, height: 20 },
    'clinical-canvas': { top: 25, left: 20, width: 55, height: 50 },
    'journey-boarding-pass': { top: 25, left: 20, width: 30, height: 35 },
    'sentinel-pulse': { top: 25, left: 50, width: 25, height: 35 },

    // AletheIA Observatory
    'aletheia-sidebar': { top: 0, left: 75, width: 25, height: 100 },
    'aletheia-risk': { top: 5, left: 75, width: 25, height: 20 },
    'aletheia-summary': { top: 25, left: 75, width: 25, height: 30 },
    'aletheia-themes': { top: 55, left: 75, width: 25, height: 25 },

    // Forms & Bookings
    'form-builder': { top: 10, left: 20, width: 60, height: 80 },
    'booking-calendar': { top: 10, left: 20, width: 60, height: 70 },

    // CRM
    'leads-kanban': { top: 15, left: 20, width: 60, height: 75 },

    // Settings
    'settings-tabs': { top: 5, left: 20, width: 60, height: 10 },
};

interface FocusImageProps {
    src: string;
    preset?: keyof typeof PRESETS | string;
    custom?: { top: number; left: number; width: number; height: number };
    alt: string;
    caption?: string;
}

/**
 * FocusImage - Smart zoom component for documentation screenshots.
 * 
 * Uses CSS transforms to show a zoomed-in portion of a full screenshot.
 * Click to view the full image in a modal.
 * 
 * @example
 * <FocusImage 
 *   src="/screenshots/profile_full.png" 
 *   preset="sentinel-pulse" 
 *   alt="Widget de Pulso Emocional" 
 * />
 */
export function FocusImage({ src, preset = 'full', custom, alt, caption }: FocusImageProps) {
    const [showFullImage, setShowFullImage] = useState(false);

    // Get coordinates from preset or custom
    const coords = custom || PRESETS[preset] || PRESETS['full'];

    // Calculate transform values
    const scaleX = 100 / coords.width;
    const scaleY = 100 / coords.height;
    const translateX = -coords.left * scaleX;
    const translateY = -coords.top * scaleY;

    return (
        <>
            {/* Zoomed Preview */}
            <div className="my-6">
                <div
                    className="relative overflow-hidden rounded-xl border border-border shadow-md bg-muted/20 cursor-zoom-in group"
                    style={{ aspectRatio: '16/9' }}
                    onClick={() => setShowFullImage(true)}
                >
                    {/* Zoomed Image */}
                    <div
                        className="absolute inset-0 transition-transform duration-300"
                        style={{
                            width: `${scaleX * 100}%`,
                            height: `${scaleY * 100}%`,
                            transform: `translate(${translateX}%, ${translateY}%)`,
                        }}
                    >
                        <img
                            src={src}
                            alt={alt}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Zoom hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Ver contexto completo</span>
                    </div>
                </div>

                {/* Caption */}
                {caption && (
                    <p className="text-center text-sm text-muted-foreground mt-2 italic">
                        {caption}
                    </p>
                )}
            </div>

            {/* Full Image Modal */}
            {showFullImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowFullImage(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setShowFullImage(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

export default FocusImage;
