import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type SearchType = "grokipedia_url" | "wikipedia_url" | "title" | "ual";

const isUal = (value: string) => /^did:dkg:/i.test(value.trim());

export const isUalSearch = (value: string) => isUal(value);

export function searchType(search: string): SearchType {
    if (isUal(search)) return "ual";
    if (search.includes("grokipedia.com")) return "grokipedia_url";
    else if (search.includes("wikipedia.org")) return "wikipedia_url";
    return "title";
}

export function extractTitleFromURL(type: SearchType, url: string): string | null {
    try {
        switch (type) {
            case "grokipedia_url": {
                const match = url.match(/grokipedia\.com\/page\/([^#?]+)/);
                return match ? decodeURIComponent(match[1].replace(/_/g, " ").replace("%20", " ")) : null;
            }
            case "wikipedia_url": {
                const match = url.match(/wikipedia\.org\/wiki\/([^#?]+)/);
                return match ? decodeURIComponent(match[1].replace(/_/g, " ").replace("%20", " ")) : null;
            }
            default:
                return null;
        }
    } catch {
        return null;
    }
}

export function populateToAllTypes(type: SearchType, query: string): Record<SearchType, string> {
    const result: Record<SearchType, string> = {
        grokipedia_url: "",
        wikipedia_url: "",
        title: "",
        ual: "",
    };

    switch (type) {
        case "grokipedia_url": {
            const title = extractTitleFromURL(type, query);
            if (title) {
                result.title = title;
                result.wikipedia_url = `https://wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
                result.grokipedia_url = query;
            }
            break;
        }
        case "wikipedia_url": {
            const title = extractTitleFromURL(type, query);
            if (title) {
                result.title = title;
                result.grokipedia_url = `https://grokipedia.com/page/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
                result.wikipedia_url = query;
            }
            break;
        }
        case "title": {
            result.title = query;
            result.grokipedia_url = `https://grokipedia.com/page/${encodeURIComponent(query.replaceAll(" ", "_"))}`;
            result.wikipedia_url = `https://wikipedia.org/wiki/${encodeURIComponent(query.replaceAll(" ", "_"))}`;
            break;
        }
        case "ual": {
            result.ual = query;
            break;
        }
    }

    return result;
}
