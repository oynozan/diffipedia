import Markdown from "react-markdown";
import { cacheLife } from "next/cache";

import { Grokipedia } from "@/lib/grokipedia";
import ParagraphWrapper from "./ParagraphWrapper";

const grokipedia = new Grokipedia();

export default async function GrokipediaArticle({ search }: { search: string }) {
    "use cache";

    cacheLife("days");

    const grokSearch = await grokipedia.fullSearch(search);

    if (typeof grokSearch !== "string") {
        return <div className="text-center text-red-500">{grokSearch.error}</div>;
    }

    return (
        <div id="grokipedia-article" className="markdown-container">
            <Markdown
                components={{
                    p: ({ children, ...props }) => {
                        const id = `gq-${Math.random().toString(36).substr(2, 9)}`;
                        return (
                            <ParagraphWrapper>
                                <p {...props} id={id}>
                                    {children}
                                </p>
                            </ParagraphWrapper>
                        );
                    },
                }}
            >
                {grokSearch}
            </Markdown>
        </div>
    );
}
