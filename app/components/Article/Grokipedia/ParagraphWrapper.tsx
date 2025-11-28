"use client";

import { useState } from "react";
import { useSelectedStore } from "@/lib/states";

export default function ParagraphWrapper({ children }: { children: React.ReactNode }) {
    const { selected, setSelected, removeSelected } = useSelectedStore();
    const [id, setID] = useState<string | null>(null);

    const isSelected = id && selected["grokipedia"].id === id;

    return (
        <div
            onClick={e => {
                // Get the first child p element
                const p = e.currentTarget.firstChild as HTMLElement;
                if (!p) return;

                const id = p.id;
                const content = p.innerText;
                setID(id);

                if (selected["grokipedia"].id === id) {
                    removeSelected("grokipedia");
                    return;
                }

                setSelected({
                    ...selected,
                    ["grokipedia"]: { id, source: "grokipedia", content },
                });
            }}
            className={isSelected ? "selected" : ""}
        >
            {children}
        </div>
    );
}
