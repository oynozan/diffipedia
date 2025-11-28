"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CircleProgress, Progress } from "@/components/ui/progress";
import JsonLdPanel from "@/components/JsonLdPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedStore } from "@/lib/states";

interface WinkSimilarity {
    cosineSimilarity: number;
    tverskySimilarity: number;
    overlapCoefficient: number;
    overallSimilarity: number;
}

interface DkgSimilarity {
    wordSimilarity: number;
    sentenceSimilarity: number;
    instinctiveSimilarity: number;
    overallSimilarity: number;
}

interface CompareResponse {
    score: number;
    score_distibution: {
        winknlp: WinkSimilarity;
        dkg: DkgSimilarity;
    };
    weights: {
        winknlp: number;
        dkg: number;
    };
    jsonld?: Record<string, unknown> | null;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const toPercentValue = (value: number) => Math.round(Math.min(Math.max(value, 0), 1) * 100);

export default function WindowContent() {
    const { selected } = useSelectedStore();
    const grok = selected.grokipedia;
    const wiki = selected.wikipedia;

    const [result, setResult] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const readyToCompare = Boolean(grok.content && wiki.content);

    useEffect(() => {
        if (!readyToCompare) {
            setResult(null);
            setError(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        async function fetchComparison() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/compare", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        grokipedia: grok.content,
                        wikipedia: wiki.content,
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Compare request failed (${response.status})`);
                }

                const data = (await response.json()) as CompareResponse;

                if (!data?.score_distibution) {
                    throw new Error("Incomplete comparison data received");
                }

                setResult(data);
            } catch (err) {
                if (controller.signal.aborted) return;
                const message =
                    err instanceof Error ? err.message : "Unable to compute comparison right now.";
                setError(message);
                setResult(null);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchComparison();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readyToCompare, grok.content, wiki.content, refreshKey]);

    const handleRetry = () => setRefreshKey(prev => prev + 1);

    const statusLabel = useMemo(() => {
        if (!result) return "Awaiting analysis";
        if (result.score >= 0.8) return "Almost identical";
        if (result.score >= 0.6) return "Highly aligned";
        if (result.score >= 0.4) return "Partially aligned";
        return "Divergent";
    }, [result]);

    if (!readyToCompare) {
        return (
            <EmptyState message="Pick a Grokipedia and a Wikipedia article to start the comparison." />
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={handleRetry} />;
    }

    if (loading) {
        return <LoadingState />;
    }

    if (!result) {
        return <EmptyState message="No comparison data yet. Try selecting a different pair." />;
    }

    const dkg = result.score_distibution.dkg;
    const wink = result.score_distibution.winknlp;
    const jsonldPayload = result.jsonld;

    const dkgMetrics = [
        { key: "wordSimilarity", label: "Word similarity", value: dkg.wordSimilarity },
        { key: "sentenceSimilarity", label: "Sentence similarity", value: dkg.sentenceSimilarity },
        { key: "instinctiveSimilarity", label: "Instinctive similarity", value: dkg.instinctiveSimilarity },
    ];

    const winkMetrics = [
        { key: "cosineSimilarity", label: "Cosine similarity", value: wink.cosineSimilarity },
        { key: "tverskySimilarity", label: "Tversky similarity", value: wink.tverskySimilarity },
        { key: "overlapCoefficient", label: "Overlap coefficient", value: wink.overlapCoefficient },
    ];

    return (
        <div className="flex h-[calc(100%-1.5rem)] flex-col gap-4 overflow-y-auto p-4 text-white">
            <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-gray20/40 p-4">
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray">Overall similarity</p>
                    <p className="text-2xl font-semibold">{formatPercent(result.score)}</p>
                    <p className="text-sm text-gray">{statusLabel}</p>
                </div>
                <CircleProgress
                    value={toPercentValue(result.score)}
                    label="Weighted score"
                    className="text-primary"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MetricCard
                    title={`DKG • ${toPercentValue(result.weights.dkg)}% weight`}
                    headline={formatPercent(dkg.overallSimilarity)}
                    metrics={dkgMetrics}
                />
                <MetricCard
                    title={`wink-nlp • ${toPercentValue(result.weights.winknlp)}% weight`}
                    headline={formatPercent(wink.overallSimilarity)}
                    metrics={winkMetrics}
                />
            </div>

            <JsonLdPanel jsonld={jsonldPayload} />
        </div>
    );
}

function MetricCard({
    title,
    headline,
    metrics,
}: {
    title: string;
    headline: string;
    metrics: { key: string; label: string; value: number }[];
}) {
    return (
        <div className="space-y-4 rounded-md border border-border bg-gray20/20 p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-gray">{title}</p>
                <span className="text-lg font-semibold">{headline}</span>
            </div>
            <div className="space-y-3">
                {metrics.map(metric => (
                    <div key={metric.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray">
                            <span>{metric.label}</span>
                            <span>{formatPercent(metric.value)}</span>
                        </div>
                        <Progress value={toPercentValue(metric.value)} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray">
            <p>{message}</p>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div>
                <p className="text-sm font-semibold text-destructive">Comparison failed</p>
                <p className="text-sm text-gray">{message}</p>
            </div>
            <Button onClick={onRetry} size="sm" className="w-fit">
                Try again
            </Button>
        </div>
    );
}
