import { create } from "zustand";

interface ISelected<T extends "grokipedia" | "wikipedia"> {
    id: string | null;
    source: T | null;
    content: string | null;
}

interface SelectedState {
    selected: { grokipedia: ISelected<"grokipedia">; wikipedia: ISelected<"wikipedia"> };
    setSelected: (selected: SelectedState["selected"]) => void;
    removeSelected: (source: "grokipedia" | "wikipedia") => void;
}

export const useSelectedStore = create<SelectedState>(set => ({
    selected: {
        grokipedia: { id: null, source: null, content: null },
        wikipedia: { id: null, source: null, content: null },
    },
    setSelected: selected => set({ selected }),
    removeSelected: source =>
        set(state => ({
            selected: {
                ...state.selected,
                [source]: { id: null, source: null, content: null },
            },
        })),
}));
