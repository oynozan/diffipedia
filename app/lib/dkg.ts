import "server-only";

/**
 * Communication module with Diffipedia DKG node
 */

type CompareRequest = {
    grokipediaArticle: string;
    wikipediaArticle: string;
    title?: string;
    recordAsset?: boolean;
    privacy?: "private" | "public";
    metadata?: Record<string, unknown>;
    publishOptions?: Record<string, unknown>;
    assetMetadata?: Record<string, unknown>;
};

type CompareResponse = {
    analysis: Record<string, unknown>;
    recorded: boolean;
    persisted?: boolean;
    ual: string | null;
    jsonld?: Record<string, unknown> | null;
};

type KnowledgeAssetResponse = {
    data: Record<string, unknown>;
};

export default class DKG {
    private static baseUrl =
        process.env.DKG_NODE_URL?.replace(/\/$/, "") || "http://localhost:9200";

    static configure({ baseUrl }: { baseUrl: string }) {
        if (!baseUrl) {
            throw new Error("DKG.configure requires a non-empty baseUrl");
        }
        DKG.baseUrl = baseUrl.replace(/\/$/, "");
    }

    /**
     * Compare a Grokipedia article with its Wikipedia counterpart.
     * When `recordAsset` is true the result is persisted as a Knowledge Asset and the DID is returned.
     */
    static async compareArticles(payload: CompareRequest): Promise<CompareResponse> {
        const res = await fetch(`${DKG.baseUrl}/diffipedia/compare`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`DKG compare failed (${res.status} ${res.statusText}): ${text}`);
        }

        return (await res.json()) as CompareResponse;
    }

    /**
     * Fetch a previously recorded Knowledge Asset by DID/UAL.
     */
    static async getKnowledgeAsset(ual: string): Promise<KnowledgeAssetResponse> {
        if (!ual?.startsWith("did:dkg:")) {
            throw new Error("UAL must start with did:dkg:");
        }

        const res = await fetch(`${DKG.baseUrl}/diffipedia/assets/${encodeURIComponent(ual)}`, {
            method: "GET",
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`DKG get asset failed (${res.status} ${res.statusText}): ${text}`);
        }

        return (await res.json()) as KnowledgeAssetResponse;
    }
}
