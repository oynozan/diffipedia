"use client";

import { useEffect, useRef } from "react";

import ComparisonWindow from "./Window";
import { useSelectedStore } from "@/lib/states";

export default function ArticlesWrapper({ children }: { children: React.ReactNode }) {
    const { selected, setSelected } = useSelectedStore();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineRef = useRef<any>(null);

    useEffect(() => {
        // Dynamically import LeaderLine to avoid SSR issues
        import("leader-line-new").then(module => {
            const LeaderLine = module.default;

            // Always remove existing line first
            if (lineRef.current) {
                lineRef.current.remove();
                lineRef.current = null;
            }

            if (selected?.["wikipedia"] && selected?.["grokipedia"]) {
                const wikiElement = document.getElementById(selected["wikipedia"].id!);
                const grokElement = document.getElementById(selected["grokipedia"].id!);

                // Create new line
                if (wikiElement && grokElement) {
                    lineRef.current = new LeaderLine(wikiElement, grokElement, {
                        // color: "rgba(255, 255, 255, 0.7)",
                        startPlugColor: "#fcba03",
                        endPlugColor: "#fa51fc",
                        gradient: true,
                        path: "grid",
                        endPlug: "behind",
                        startPlug: "behind",
                        startSocket: "left",
                        endSocket: "right",
                        size: 6,
                        dropShadow: true,
                    });
                }
            }
        });

        return () => {
            if (lineRef.current) {
                lineRef.current.remove();
                lineRef.current = null;
            }
        };
    }, [selected]);

    // Update line position on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (lineRef.current) {
                lineRef.current.position();
            }
        };

        const scrollContainers = document.querySelectorAll(".overflow-y-auto");
        scrollContainers.forEach(container => {
            container.addEventListener("scroll", handleScroll);
        });

        window.addEventListener("resize", handleScroll);

        return () => {
            scrollContainers.forEach(container => {
                container.removeEventListener("scroll", handleScroll);
            });
            window.removeEventListener("resize", handleScroll);
        };
    }, [selected]);

    // first time render
    useEffect(() => {
        setSelected({
            grokipedia: { id: null, source: null, content: null },
            wikipedia: { id: null, source: null, content: null },
        });
    }, []);

    return (
        <div className="w-full h-full flex">
            <ComparisonWindow />
            {children}
        </div>
    );
}
