"use client";

import { ChevronsUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import WindowContent from "./Content";
import { useSelectedStore } from "@/lib/states";

const Y_MIN = 47;

export default function ComparisonWindow() {
    const { selected } = useSelectedStore();
    const grok = selected["grokipedia"];
    const wiki = selected["wikipedia"];

    const [pos, setPos] = useState({ x: 100 - Y_MIN, y: 100 });
    const [dragging, setDragging] = useState(false);
    const [closed, setClosed] = useState(false);

    const windowRef = useRef<HTMLDivElement | null>(null);
    const dragStart = useRef({ x: 0, y: 0 });

    const startDrag = (e: React.PointerEvent) => {
        setDragging(true);
        dragStart.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onDrag = (e: PointerEvent) => {
        if (!dragging) return;

        const winEl = windowRef.current;
        if (!winEl) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const newX = Math.min(
            Math.max(0, e.clientX - dragStart.current.x),
            viewportWidth - winEl.offsetWidth,
        );

        const newY = Math.min(
            Math.max(Y_MIN, e.clientY - dragStart.current.y),
            viewportHeight - winEl.offsetHeight,
        );

        setPos({ x: newX, y: newY });
    };

    const endDrag = () => setDragging(false);

    useEffect(() => {
        window.addEventListener("pointermove", onDrag);
        window.addEventListener("pointerup", endDrag);

        return () => {
            window.removeEventListener("pointermove", onDrag);
            window.removeEventListener("pointerup", endDrag);
        };
    }, [dragging]);

    if (!grok?.id || !wiki?.id) return null;

    if (closed) {
        return (
            <div
                className="fixed bottom-0 left-10 w-36 h-8 bg-background border border-border border-b-background rounded-t-md z-50 cursor-pointer flex items-center justify-center hover:h-12 transition-all"
                onClick={() => setClosed(false)}
            >
                <ChevronsUp size={20} className="text-gray" />
            </div>
        );
    }

    return (
        <div
            ref={windowRef}
            className="absolute w-240 min-h-100 h-content bg-background border border-border rounded-sm text-white z-50"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        >
            <div
                className="flex items-center justify-between border-b border-border h-6 bg-gray20 px-1 cursor-move"
                onPointerDown={startDrag}
            >
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                    <X
                        size={18}
                        className="text-gray cursor-pointer"
                        onClick={() => setClosed(true)}
                    />
                </div>
            </div>
            <WindowContent />
        </div>
    );
}
