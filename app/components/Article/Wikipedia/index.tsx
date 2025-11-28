import { cacheLife } from "next/cache";

import { Wikipedia } from "@/lib/wikipedia";
import ContentWrapper from "./ContentWrapper";

import "./wikipedia.scss";

const wikipedia = new Wikipedia();

export default async function WikipediaArticle({ search }: { search: string }) {
    "use cache";    

    cacheLife("days");

    const wikiSearch = await wikipedia.fullSearch(search);

    if (typeof wikiSearch !== "string") {
        return <div className="text-center text-red-500">{wikiSearch.error}</div>;
    }

    return <ContentWrapper html={wikiSearch} />;
}
