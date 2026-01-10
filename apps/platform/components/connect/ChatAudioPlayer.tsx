'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface ChatAudioPlayerProps {
    src: string;
    className?: string;
}

/**
 * Custom audio player for WhatsApp voice messages.
 * Replaces native <audio> with a styled Play/Pause + Progress bar.
 */
export function ChatAudioPlayer({ src, className = '' }: ChatAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = (clickX / rect.width) * 100;
        const newTime = (newProgress / 100) * duration;

        audio.currentTime = newTime;
        setProgress(newProgress);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg bg-muted/50 ${className}`}>
            {/* Hidden audio element */}
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white hover:bg-brand/90 active:scale-95 transition-all"
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4" />
                ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                )}
            </button>

            {/* Progress bar */}
            <div className="flex-1 flex flex-col gap-1">
                <div
                    className="h-1.5 bg-muted rounded-full cursor-pointer overflow-hidden"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-brand rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatTime((progress / 100) * duration)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
