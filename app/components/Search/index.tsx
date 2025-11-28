"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { SearchIcon, SendHorizonalIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchType } from "@/utils/helpers";

const placeholders = [
    "Quantum Mechanics",
    "Polkadot Blockchain",
    "en.wikipedia.org/wiki/Artificial_intelligence",
    "grokipedia.com/page/Machine_learning",
    "did:dkg:diffipedia:example:1234",
    "Photosynthesis",
];

export default function SearchInput() {
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [placeholder, setPlaceholder] = useState("");
    const [index, setIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPlaceholder = placeholders[index];
        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    // Typing
                    if (placeholder.length < currentPlaceholder.length) {
                        setPlaceholder(currentPlaceholder.slice(0, placeholder.length + 1));
                    } else {
                        // Finished typing, wait then start deleting
                        setTimeout(() => setIsDeleting(true), 1500);
                    }
                } else {
                    // Deleting
                    if (placeholder.length > 0) {
                        setPlaceholder(placeholder.slice(0, -1));
                    } else {
                        // Finished deleting, move to next placeholder
                        setIsDeleting(false);
                        setIndex(prev => (prev + 1) % placeholders.length);
                    }
                }
            },
            isDeleting ? 30 : placeholder.length === currentPlaceholder.length ? 0 : 50,
        );

        return () => clearTimeout(timeout);
    }, [placeholder, index, isDeleting]);

    const handleSearch = () => {
        const query = search.trim();
        if (!query) return;
        const type = searchType(query);
        if (type === "ual") {
            router.push(`/ual/${encodeURIComponent(query)}`);
            return;
        }
        router.push(`/diff/${encodeURIComponent(query)}`);
    };

    return (
        <div className="search-container flex justify-center w-full mt-4 mb-2">
            <div className="relative w-full">
                <Input
                    placeholder={placeholder}
                    className="rounded-full bg-gray20! w-full md:text-lg h-12 pl-11 pr-6 font-inter focus:ring-0! focus:bg-gray50 focus:border-accent transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                />
                <Button
                    variant="outline"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full flex items-center justify-center gap-3 transition-all text-md text-muted-foreground border-white/12 hover:border-white/30"
                    style={
                        search.trim()
                            ? { opacity: 1, visibility: "visible" }
                            : { opacity: 0, visibility: "hidden" }
                    }
                    onClick={handleSearch}
                >
                    <SendHorizonalIcon className="w-5 h-5 ml-0.5 mb-0.5 -rotate-45" />
                </Button>
                <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
        </div>
    );
}
