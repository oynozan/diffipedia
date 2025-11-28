import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";

import ArticlesNav from "@/components/Article/Nav";
import { Skeleton } from "@/components/ui/skeleton";
import ArticlesWrapper from "@/components/Article/Wrapper";
import WikipediaArticle from "@/components/Article/Wikipedia";
import GrokipediaArticle from "@/components/Article/Grokipedia";
import { populateToAllTypes, searchType } from "@/utils/helpers";

import "./search.scss";

export default async function Search({
    params,
}: Readonly<{
    params: Promise<{ search: string }>;
}>) {
    const { search } = await params;
    const decodedSearch = decodeURIComponent(search);

    const type = searchType(decodedSearch);

    if (type === "ual") {
        redirect(`/ual/${encodeURIComponent(decodedSearch)}`);
    }

    const { grokipedia_url, wikipedia_url, title } = populateToAllTypes(type, decodedSearch);

    if (type !== "title") {
        // Redirect to /diff/[title]
        redirect(`/diff/${encodeURIComponent(title)}`);
    }

    return (
        <div id="diff" className="flex-col h-full">
            <ArticlesNav />
            <ArticlesWrapper>
                <div className="flex-1 w-1/2 max-w-1/2 h-full border-r border-border">
                    <div className="flex items-center justify-between border-b border-border h-12 px-2 bg-black/5">
                        <h3 className="text-lg">Grokipedia</h3>
                        <a
                            className="flex items-center gap-1 text-gray transition-colors hover:text-white/90"
                            target="_blank"
                            href={grokipedia_url}
                        >
                            <ExternalLink size={14} />
                        </a>
                    </div>
                    <div className="py-4 px-8 overflow-y-auto overflow-x-hidden max-h-[calc(100%-48px)]">
                        <Suspense fallback={<Loading />}>
                            <GrokipediaArticle search={title} />
                        </Suspense>
                    </div>
                </div>
                <div className="flex-1 w-1/2 max-w-1/2 h-full">
                    <div className="flex items-center justify-between border-b border-border h-12 px-2 bg-black/5">
                        <h3 className="text-lg">Wikipedia</h3>
                        <a
                            className="flex items-center gap-1 text-gray transition-colors hover:text-white/90"
                            target="_blank"
                            href={wikipedia_url}
                        >
                            <ExternalLink size={14} />
                        </a>
                    </div>
                    <div className="py-4 px-8 overflow-y-auto overflow-x-hidden max-h-[calc(100%-48px)]">
                        <Suspense fallback={<Loading />}>
                            <WikipediaArticle search={title} />
                        </Suspense>
                    </div>
                </div>
            </ArticlesWrapper>
        </div>
    );
}

function Loading() {
    return (
        <div className="flex flex-col gap-1">
            <Skeleton className="w-full h-12 rounded-sm" />
            <Skeleton className="w-full h-4 rounded-sm" />
            <Skeleton className="w-full h-4 rounded-sm" />
            <Skeleton className="w-full h-4 rounded-sm mb-6" />
            <Skeleton className="w-full h-8 rounded-sm mb-6" />
            <Skeleton className="w-full h-8 rounded-sm" />
            <Skeleton className="w-full h-4 rounded-sm" />
            <Skeleton className="w-full h-8 rounded-sm mb-6" />
            <Skeleton className="w-full h-8 rounded-sm" />
            <Skeleton className="w-full h-4 rounded-sm" />
        </div>
    );
}
