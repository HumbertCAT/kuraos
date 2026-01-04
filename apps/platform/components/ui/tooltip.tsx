"use client";

import * as React from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
    const [visible, setVisible] = React.useState(false);
    const [coords, setCoords] = React.useState({ x: 0, y: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = side === "top" ? rect.top - 8 : rect.bottom + 8;
            setCoords({ x, y });
            setVisible(true);
        }
    };

    const hideTooltip = () => setVisible(false);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-flex"
            >
                {children}
            </div>
            {visible && typeof window !== "undefined" &&
                createPortal(
                    <div
                        className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
                        style={{
                            left: coords.x,
                            top: coords.y,
                            transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                        }}
                    >
                        {content}
                    </div>,
                    document.body
                )}
        </>
    );
}
