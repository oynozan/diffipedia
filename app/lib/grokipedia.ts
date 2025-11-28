/**
 * Grokipedia service class
 */

import "server-only";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";

export class Grokipedia {
    async firstURLBySearch(title: string): Promise<string | { error: string }> {
        if (typeof title !== "string" || !title?.trim()) return { error: "Empty search query." };

        const result = await fetch(
            `https://grokipedia.com/api/full-text-search?query=${encodeURIComponent(
                title.toLowerCase().replaceAll(" ", "+"),
            )}&limit=1&offset=0`,
        );

        if (!result.ok) return { error: `Grokipedia search is failed.` };

        const data = await result.json();
        if (data?.results?.length === 0)
            return { error: `No Grokipedia article found for "${title.replaceAll("_", " ")}".` };

        return `https://grokipedia.com/page/${data.results[0].slug}`;
    }

    async fetchPageContent(url: string) {
        const result = await fetch(url);
        const html = await result.text();
        const dom = new JSDOM(html);

        const article = dom.window.document.querySelector("article article");
        if (!article) return { error: "Failed to extract article content." };

        // Remove <sup /> elements
        article.querySelectorAll("sup").forEach((el) => el.remove());

        // Change <a> elements' href from /page/ to /diff/
        article.querySelectorAll("a").forEach((el) => {
            if (el.href.startsWith("/page/")) {
                el.href = el.href.replace("/page/", "/diff/");
            }
        });

        const markdown = NodeHtmlMarkdown.translate(article.innerHTML);
        return markdown;
    }

    async fullSearch(query: string): Promise<string | { error: string }> {
        const url = await this.firstURLBySearch(query);
        if (typeof url !== "string") return url;

        const content = await this.fetchPageContent(url);
        return content;
    }
}
