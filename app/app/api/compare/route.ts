/**
 * Returns a weighted average of multiple comparison results.
 *
 * wink-nlp (20%):
 *  - Cosine Similarity (5%)
 *  - Tversky Similarity (7%)
 *  - Overlap Coefficient (8%)
 *
 * DKG (80%):
 *  - Word Similarity - Jaccard word overlap (40%)
 *  - Sentence Similarity - Bidirectional sentence overlap (35%)
 *  - Instinctive Similarity - LLM-guided instinctive similarity (25%)
 */

import {
    getDkgComparison,
    getWinkComparison,
    type DkgScoreDistribution,
    type WinkScoreDistribution,
} from "@/lib/compare-engines";
import {
    buildCompareCacheKey,
    getCompareCacheValue,
    setCompareCacheValue,
} from "@/lib/compare-cache";

interface IDiffResult {
    score: number;
    score_distibution: {
        winknlp: WinkScoreDistribution;
        dkg: DkgScoreDistribution;
    };
    weights: {
        winknlp: number;
        dkg: number;
    };
    jsonld?: Record<string, unknown> | null;
}

export async function POST(req: Request): Promise<Response> {
    const { grokipedia, wikipedia } = await req.json();

    if (!grokipedia || !wikipedia) {
        return Response.json(
            {
                status: false,
                message: "Both grokipedia and wikipedia content are required",
            },
            { status: 400 },
        );
    }

    const aggregateCacheKey = buildCompareCacheKey("aggregate", grokipedia, wikipedia);
    const cachedAggregate = await getCompareCacheValue<IDiffResult>(aggregateCacheKey);

    if (cachedAggregate) {
        return Response.json({
            ...cachedAggregate,
            jsonld: cachedAggregate.jsonld ?? null,
        });
    }

    const [winkComparison, dkgComparison] = await Promise.all([
        getWinkComparison(grokipedia, wikipedia),
        getDkgComparison(grokipedia, wikipedia),
    ]);

    if (!winkComparison || !dkgComparison) {
        return Response.json({
            status: false,
            message: "Failed to compute comparison results",
        });
    }

    const winkResult = winkComparison.scoreDistribution;
    const dkgResult = dkgComparison.scoreDistribution;
    const score = dkgResult.overallSimilarity * 0.8 + winkResult.overallSimilarity * 0.2;

    console.log(dkgComparison);

    const responseBody: IDiffResult = {
        score,
        score_distibution: {
            winknlp: winkResult,
            dkg: dkgResult,
        },
        weights: {
            winknlp: 0.2,
            dkg: 0.8,
        },
        jsonld: dkgComparison.jsonld ?? null,
    };

    await setCompareCacheValue(aggregateCacheKey, responseBody);

    return Response.json(responseBody);
}
