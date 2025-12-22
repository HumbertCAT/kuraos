'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface PhotoCaptureProps {
    onPhotoCapture: (photoBlob: Blob) => void;
    disabled?: boolean;
}

export default function PhotoCapture({ onPhotoCapture, disabled }: PhotoCaptureProps) {
    const t = useTranslations('ClinicalJournal');
    const [isCapturing, setIsCapturing] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Set video srcObject when stream is available and isCapturing
    useEffect(() => {
        if (isCapturing && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCapturing]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera on mobile
            });
            streamRef.current = stream;
            setHasPermission(true);
            setVideoReady(false);
            setIsCapturing(true);
        } catch (err) {
            console.error('Failed to access camera:', err);
            setHasPermission(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCapturing(false);
        setVideoReady(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !videoReady) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    onPhotoCapture(blob);
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    }, [onPhotoCapture, stopCamera, videoReady]);

    if (hasPermission === false) {
        return (
            <button
                disabled
                className="px-4 py-2 border border-slate-300 rounded-lg opacity-50 text-slate-400 cursor-not-allowed"
                title={t('cameraNotAvailable')}
            >
                📷 {t('takePhoto')}
            </button>
        );
    }

    if (isCapturing) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex flex-col">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => setVideoReady(true)}
                        className="flex-1 w-full object-cover"
                        style={{ minHeight: '60vh' }}
                    />
                    <div className="flex gap-4 p-6 justify-center bg-black">
                        <button
                            onClick={capturePhoto}
                            disabled={!videoReady}
                            className="px-8 py-4 bg-white text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer font-semibold disabled:opacity-50 text-lg"
                        >
                            📸 {t('capture')}
                        </button>
                        <button
                            onClick={stopCamera}
                            className="px-8 py-4 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors cursor-pointer text-lg"
                        >
                            ✕ {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={startCamera}
            disabled={disabled}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
            </svg>
            {t('takePhoto')}
        </button>
    );
}
