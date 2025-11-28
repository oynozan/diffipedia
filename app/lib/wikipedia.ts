/**
 * Wikipedia API class
 */

import "server-only";
import { JSDOM } from "jsdom";
import { proxyFetch } from "./proxy";

export class Wikipedia {
    keyBySearch(title: string): Promise<string | { error: string }> {
        return new Promise(async resolve => {
            if (typeof title !== "string" || !title?.trim())
                resolve({ error: "Empty search query." });

            const encodedTitle = encodeURIComponent(title.toLowerCase().replaceAll(" ", "+"));
            const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodedTitle}&limit=1`;

            proxyFetch(url, "GET", {}, 1)
                .then(async data => {
                    if (data?.pages?.length === 0 || !data?.pages![0]?.key)
                        resolve({ error: `No Wikipedia article found for "${title.replaceAll("_", " ")}".` });
                    resolve(data.pages[0].key);
                })
                .catch(err => {
                    console.error("Wikipedia search error:", err);
                    resolve({ error: `Wikipedia search is failed.` });
                });
        });
    }

    async fetchPageContent(key: string) {
        const endpoint = `https://en.wikipedia.org/api/rest_v1/page/html/${key}`;

        const res = await fetch(endpoint, {
            cache: "force-cache",
            headers: {
                accept: "text/html",
                profile: 'profile="https://www.mediawiki.org/wiki/Specs/HTML/2.1.0"',
                charset: "utf-8",
            },
        });

        const html = await res.text();
        html.replaceAll("/w/resources/", "https://en.wikipedia.org/w/resources/");

        const dom = new JSDOM(html);

        // Styles
        const styleEls = dom.window.document.querySelectorAll("style");
        const styles = Array.from(styleEls)
            .map(style => `<style>${style.innerHTML}</style>`)
            .join("");

        // Content
        const body = dom.window.document.querySelector("body");
        if (!body) return { error: "Failed to extract article content." };

        const toRemove = [
            "sup",
            "section:has(#Sources)", // Sources
            "section:has(#References)", // References
            "section:has(#External_links)", // External links
            "section:has(#See_also)", // See also
            "section:has(#Further_reading)", // Further reading
            "section:has(#Notes)", // Notes
            "section:has(#Footnotes)", // Footnotes
            "section:has(#Bibliography)", // Bibliography
            ".hatnote", // hatnotes
        ];
        toRemove.forEach(selector => {
            body.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Attach IDs
        body.querySelectorAll("p").forEach(p => {
            const randomID = Math.random().toString(36).substring(2, 10);
            p.setAttribute("id", `wp-${randomID}`);

            // Create wrapper div
            const wrapper = dom.window.document.createElement("div");
            wrapper.setAttribute("data-paragraph-wrapper", "true");
            wrapper.setAttribute("data-p-id", `wp-${randomID}`);

            // Replace p with wrapper containing p
            p.parentNode?.replaceChild(wrapper, p);
            wrapper.appendChild(p);
        });

        return styles + body.innerHTML;
    }

    async fullSearch(query: string): Promise<string | { error: string }> {
        const key = await this.keyBySearch(query);
        if (typeof key !== "string") return key;

        const content = await this.fetchPageContent(key);
        return content;
    }
}
