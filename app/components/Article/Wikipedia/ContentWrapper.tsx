"use client";

import { useEffect, useRef } from "react";

import { useSelectedStore } from "@/lib/states";

export default function ContentWrapper({ html }: { html: string }) {
    const { selected, setSelected, removeSelected } = useSelectedStore();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const wrapper = target.closest('[data-paragraph-wrapper="true"]');

            if (!wrapper) return;

            const pElement = wrapper.querySelector("p");
            if (!pElement) return;

            const id = pElement.id;
            const content = pElement.innerText;

            if (selected["wikipedia"]?.id === id) {
                removeSelected("wikipedia");
                pElement.classList.remove("selected");
            } else {
                setSelected({
                    ...selected,
                    ["wikipedia"]: { id, source: "wikipedia", content },
                });

                // Remove 'selected' class from any previously selected paragraph
                const previousSelected = container.querySelector(".selected");
                if (previousSelected) {
                    previousSelected.classList.remove("selected");
                }

                pElement.classList.add("selected");
            }
        };

        container.addEventListener("click", handleClick);
        return () => container.removeEventListener("click", handleClick);
    }, [selected, setSelected, removeSelected]);

    return (
        <div
            ref={containerRef}
            id="wikipedia-article"
            className="mw-parser-output"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
