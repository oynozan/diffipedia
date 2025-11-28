import "server-only";

import DKG from "@/lib/dkg";
import {
    buildCompareCacheKey,
    getCompareCacheValue,
    setCompareCacheValue,
} from "@/lib/compare-cache";
import { WinkNLP } from "@/lib/winknlp";

export type WinkScoreDistribution = ReturnType<typeof WinkNLP.computeSimilarities>;

export type CompareEngineResponse<TScoreDistribution> = {
    score: number;
    scoreDistribution: TScoreDistribution;
};

type DkgMetric = {
    value: number;
};

type DkgMetrics = {
    wordSimilarity: DkgMetric;
    sentenceSimilarity: DkgMetric;
    instinctiveSimilarity: DkgMetric;
    overallSimilarity: DkgMetric;
};

export type DkgScoreDistribution = {
    wordSimilarity: number;
    sentenceSimilarity: number;
    instinctiveSimilarity: number;
    overallSimilarity: number;
};

export type WinkComparisonResponse = CompareEngineResponse<WinkScoreDistribution>;
export type DkgComparisonResponse = CompareEngineResponse<DkgScoreDistribution> & {
    jsonld: Record<string, unknown> | null;
};

export const getWinkComparison = async (
    grokipedia: string,
    wikipedia: string,
): Promise<WinkComparisonResponse | null> => {
    const cacheKey = buildCompareCacheKey("winknlp", grokipedia, wikipedia);
    const cached = await getCompareCacheValue<WinkComparisonResponse>(cacheKey);
    if (cached) {
        return cached;
    }

    const scoreDistribution = WinkNLP.computeSimilarities(grokipedia, wikipedia);

    if (!scoreDistribution?.cosineSimilarity) {
        return null;
    }

    const payload: WinkComparisonResponse = {
        score: scoreDistribution.overallSimilarity,
        scoreDistribution,
    };

    await setCompareCacheValue(cacheKey, payload);

    return payload;
};

export const getDkgComparison = async (
    grokipedia: string,
    wikipedia: string,
): Promise<DkgComparisonResponse | null> => {
    const cacheKey = buildCompareCacheKey("dkg", grokipedia, wikipedia);
    const cached = await getCompareCacheValue<DkgComparisonResponse>(cacheKey);
    if (cached) {
        return {
            ...cached,
            jsonld: cached.jsonld ?? null,
        };
    }

    const rawDkgResult = await DKG.compareArticles({
        grokipediaArticle: grokipedia,
        wikipediaArticle: wikipedia,
        recordAsset: false,
    });

    if (!rawDkgResult?.analysis?.metrics) {
        return null;
    }

    const dkgMetrics = rawDkgResult.analysis.metrics as DkgMetrics;

    const scoreDistribution: DkgScoreDistribution = {
        wordSimilarity: dkgMetrics.wordSimilarity.value,
        sentenceSimilarity: dkgMetrics.sentenceSimilarity.value,
        instinctiveSimilarity: dkgMetrics.instinctiveSimilarity.value,
        overallSimilarity: dkgMetrics.overallSimilarity.value,
    };

    const jsonld = (rawDkgResult.jsonld ?? null) as Record<string, unknown> | null;

    const payload: DkgComparisonResponse = {
        score: scoreDistribution.overallSimilarity,
        scoreDistribution,
        jsonld,
    };

    await setCompareCacheValue(cacheKey, payload);

    return payload;
};


