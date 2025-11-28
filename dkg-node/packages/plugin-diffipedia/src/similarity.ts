import { createHash, randomUUID } from "crypto";
import { fetchInstinctiveSimilarity, isAnthropicProviderEnabled } from "./llm.js";
import { clamp } from "./math.js";
import type {
  DiffAnalysisResult,
  DiffComparisonInput,
  DiffItemProfile,
  DiffMetricValue,
  DiffMetrics,
  DiffStats,
} from "./types";

const NON_ALPHANUMERIC = /[^a-z0-9]+/gi;
const MULTISPACE = /\s+/g;
const PUNCTUATION_REGEX = /[,:;.!?]/g;
const SENTENCE_REGEX = /[^.!?]+[.!?]?/g;

type InstinctiveSignals = {
  charScore: number;
  lengthScore: number;
  structureScore: number;
  punctuationScore: number;
  fallback: number;
};

type InstinctiveStats = {
  wordSimilarity: number;
  sentenceSimilarity: number;
  sharedVocabularyRatio: number;
};

const toPercentage = (value: number) =>
  Number((clamp(value) * 100).toFixed(2));

const sanitize = (text: string) =>
  text.toLowerCase().replace(NON_ALPHANUMERIC, " ").replace(MULTISPACE, " ").trim();

export const tokenizeWords = (text: string) =>
  sanitize(text)
    .split(" ")
    .filter(Boolean);

const splitSentences = (text: string) => {
  const matches = text.replace(MULTISPACE, " ").match(SENTENCE_REGEX);
  if (!matches) return [];
  return matches.map((sentence) => sentence.trim()).filter(Boolean);
};

const jaccardSimilarity = (a: string[], b: string[]) => {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 1 : intersection / union;
};

const buildBigrams = (text: string) => {
  const condensed = sanitize(text).replace(/ /g, "");
  if (condensed.length < 2) return condensed ? [condensed] : [];
  const grams: string[] = [];
  for (let i = 0; i < condensed.length - 1; i++) {
    grams.push(condensed.slice(i, i + 2));
  }
  return grams;
};

const sorensenDice = (textA: string, textB: string) => {
  const bigramsA = buildBigrams(textA);
  const bigramsB = buildBigrams(textB);

  const sizeA = bigramsA.length;
  const sizeB = bigramsB.length;
  if (!sizeA && !sizeB) return 1;
  if (!sizeA || !sizeB) return 0;

  const counts = new Map<string, number>();
  for (const gram of bigramsA) {
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }

  let overlap = 0;
  for (const gram of bigramsB) {
    const count = counts.get(gram);
    if (count) {
      overlap++;
      if (count === 1) {
        counts.delete(gram);
      } else {
        counts.set(gram, count - 1);
      }
    }
  }

  return (2 * overlap) / (sizeA + sizeB);
};

const normalizedDifferenceScore = (a: number, b: number) => {
  const max = Math.max(a, b, 1);
  const diff = Math.abs(a - b);
  return clamp(1 - diff / max);
};

const countMatches = (text: string, regex: RegExp) =>
  (text.match(regex) || []).length;

const previewText = (text: string) => {
  const cleaned = text.replace(MULTISPACE, " ").trim();
  if (cleaned.length <= 240) return cleaned;
  return `${cleaned.slice(0, 237)}...`;
};

const fingerprint = (text: string) =>
  createHash("sha256").update(text).digest("hex");

const computeInstinctiveSignals = (
  textA: string,
  textB: string,
): InstinctiveSignals => {
  const charScore = sorensenDice(textA, textB);
  const lengthScore = normalizedDifferenceScore(textA.length, textB.length);
  const structureScore = normalizedDifferenceScore(
    splitSentences(textA).length,
    splitSentences(textB).length,
  );
  const punctuationScore = normalizedDifferenceScore(
    countMatches(textA, PUNCTUATION_REGEX),
    countMatches(textB, PUNCTUATION_REGEX),
  );

  const fallback =
    charScore * 0.45 +
    lengthScore * 0.2 +
    structureScore * 0.2 +
    punctuationScore * 0.15;

  return {
    charScore: clamp(charScore),
    lengthScore: clamp(lengthScore),
    structureScore: clamp(structureScore),
    punctuationScore: clamp(punctuationScore),
    fallback: clamp(fallback),
  };
};

const metric = (value: number, technique: string): DiffMetricValue => ({
  value: clamp(value),
  percentage: toPercentage(value) ?? 0,
  technique,
});

const buildItemProfile = (
  label: string,
  text: string,
  tokens: string[],
  sentences: string[],
  source: DiffItemProfile["source"],
): DiffItemProfile => ({
  label,
  source,
  wordCount: tokens.length,
  sentenceCount: sentences.length,
  characterCount: text.length,
  preview: previewText(text),
  fingerprint: fingerprint(text),
});

const buildStats = (
  tokensA: string[],
  tokensB: string[],
  sentencesA: string[],
  sentencesB: string[],
  charLengthA: number,
  charLengthB: number,
): DiffStats => {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const sharedWords = [...setA].filter((word) => setB.has(word));
  const uniqueToA = [...setA].filter((word) => !setB.has(word));
  const uniqueToB = [...setB].filter((word) => !setA.has(word));
  const sharedWordRatio =
    setA.size === 0 && setB.size === 0
      ? 1
      : sharedWords.length / Math.max(setA.size + setB.size - sharedWords.length, 1);

  return {
    sharedWordRatio: clamp(sharedWordRatio),
    sharedWords: sharedWords.slice(0, 25),
    uniqueToA: uniqueToA.slice(0, 25),
    uniqueToB: uniqueToB.slice(0, 25),
    tokensA: tokensA.length,
    tokensB: tokensB.length,
    sentencesA: sentencesA.length,
    sentencesB: sentencesB.length,
    charLengthA,
    charLengthB,
  };
};

export const wordSimilarity = (textA: string, textB: string) =>
  jaccardSimilarity(tokenizeWords(textA), tokenizeWords(textB));

export const sentenceSimilarity = (textA: string, textB: string) => {
  const sentencesA = splitSentences(textA);
  const sentencesB = splitSentences(textB);
  if (!sentencesA.length || !sentencesB.length) {
    return wordSimilarity(textA, textB);
  }

  const averageBestScore = (
    source: string[],
    target: string[],
  ) => {
    if (!source.length || !target.length) return 0;
    return (
      source.reduce((sum, sentence) => {
        const tokens = tokenizeWords(sentence);
        let best = 0;
        for (const candidate of target) {
          const candidateTokens = tokenizeWords(candidate);
          const score = jaccardSimilarity(tokens, candidateTokens);
          if (score > best) best = score;
        }
        return sum + best;
      }, 0) / source.length
    );
  };

  const scoreA = averageBestScore(sentencesA, sentencesB);
  const scoreB = averageBestScore(sentencesB, sentencesA);
  return clamp((scoreA + scoreB) / 2);
};

export const instinctiveSimilarity = async (
  textA: string,
  textB: string,
  opts?: {
    labelA?: string;
    labelB?: string;
    title?: string;
    stats?: InstinctiveStats;
    signals?: InstinctiveSignals;
  },
) => {
  const signals = opts?.signals ?? computeInstinctiveSignals(textA, textB);
  const stats = opts?.stats ?? {
    wordSimilarity: 0,
    sentenceSimilarity: 0,
    sharedVocabularyRatio: 0,
  };
  const labelA = opts?.labelA || "Text A";
  const labelB = opts?.labelB || "Text B";

  if (isAnthropicProviderEnabled()) {
    try {
      const result = await fetchInstinctiveSimilarity({
        grokipediaArticle: textA,
        wikipediaArticle: textB,
        title: opts?.title || labelA || labelB || "Article comparison",
        heuristics: signals,
        stats,
      });
      if (Number.isFinite(result.score)) return clamp(result.score);
    } catch (error) {
      console.warn(
        "[Diffipedia] Instinctive similarity LLM failed. Using heuristic fallback.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return signals.fallback;
};

export const DEFAULT_WEIGHTS = {
  word: 0.4,
  sentence: 0.35,
  instinctive: 0.25,
} as const;

export const overallSimilarity = (
  wordScore: number,
  sentenceScore: number,
  instinctiveScore: number,
) =>
  clamp(
    wordScore * DEFAULT_WEIGHTS.word +
      sentenceScore * DEFAULT_WEIGHTS.sentence +
      instinctiveScore * DEFAULT_WEIGHTS.instinctive,
  );

const buildSummary = (
  metrics: DiffMetrics,
  stats: DiffStats,
  labelA: string,
  labelB: string,
) => {
  const vocabShare = toPercentage(stats.sharedWordRatio);
  return `${labelA} and ${labelB} share ${vocabShare}% of their core vocabulary. Word overlap scored ${metrics.wordSimilarity.percentage}%, sentence alignment ${metrics.sentenceSimilarity.percentage}%, leading to an overall similarity of ${metrics.overallSimilarity.percentage}%.`;
};

export const calculateDiffAnalysis = async (
  input: DiffComparisonInput,
): Promise<DiffAnalysisResult> => {
  const title = input.title?.trim();
  const grokLabel = title ? `${title} (Grokipedia)` : "Grokipedia Article";
  const wikiLabel = title ? `${title} (Wikipedia)` : "Wikipedia Article";
  const grokTokens = tokenizeWords(input.grokipediaArticle);
  const wikiTokens = tokenizeWords(input.wikipediaArticle);
  const grokSentences = splitSentences(input.grokipediaArticle);
  const wikiSentences = splitSentences(input.wikipediaArticle);

  const wordScore = wordSimilarity(
    input.grokipediaArticle,
    input.wikipediaArticle,
  );
  const sentenceScore = sentenceSimilarity(
    input.grokipediaArticle,
    input.wikipediaArticle,
  );

  const stats = buildStats(
    grokTokens,
    wikiTokens,
    grokSentences,
    wikiSentences,
    input.grokipediaArticle.length,
    input.wikipediaArticle.length,
  );

  const signals = computeInstinctiveSignals(
    input.grokipediaArticle,
    input.wikipediaArticle,
  );
  const instinctiveScore = await instinctiveSimilarity(
    input.grokipediaArticle,
    input.wikipediaArticle,
    {
      labelA: grokLabel,
      labelB: wikiLabel,
      stats: {
        wordSimilarity: wordScore,
        sentenceSimilarity: sentenceScore,
        sharedVocabularyRatio: stats.sharedWordRatio,
      },
      signals,
      title,
    } as any,
  );

  const overallScore = overallSimilarity(
    wordScore,
    sentenceScore,
    instinctiveScore,
  );

  const metrics: DiffMetrics = {
    wordSimilarity: metric(wordScore, "Jaccard word overlap"),
    sentenceSimilarity: metric(sentenceScore, "Bidirectional sentence overlap"),
    instinctiveSimilarity: metric(
      instinctiveScore,
      "LLM-guided instinctive similarity",
    ),
    overallSimilarity: metric(
      overallScore,
      "Weighted aggregate across metrics",
    ),
  };

  const compared: DiffAnalysisResult["compared"] = {
    a: buildItemProfile(
      grokLabel,
      input.grokipediaArticle,
      grokTokens,
      grokSentences,
      "grokipedia",
    ),
    b: buildItemProfile(
      wikiLabel,
      input.wikipediaArticle,
      wikiTokens,
      wikiSentences,
      "wikipedia",
    ),
  };

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    compared,
    metrics,
    stats,
    summary: buildSummary(metrics, stats, grokLabel, wikiLabel),
  };
};
