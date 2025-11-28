import type {
  KnowledgeAssetPayload,
  DiffAssetMetadata,
} from "./types";

const DEFAULT_CONTEXT = [
  "https://schema.org/",
  {
    diffipedia: "https://diffipedia.origintrail.network/terms#",
    DifferenceProfile: "diffipedia:DifferenceProfile",
    comparisonId: "diffipedia:comparisonId",
    comparedItem: "diffipedia:comparedItem",
    metrics: "diffipedia:metrics",
    summary: "diffipedia:summary",
    sharedVocabularyRatio: "diffipedia:sharedVocabularyRatio",
    sharedWords: "diffipedia:sharedWords",
    uniqueToA: "diffipedia:uniqueToA",
    uniqueToB: "diffipedia:uniqueToB",
  },
];

export const buildDiffKnowledgeAsset = (payload: KnowledgeAssetPayload) => {
  const { analysis, metadata, assetMetadata, title } = payload;
  const grok = analysis.compared.a;
  const wiki = analysis.compared.b;

  const comparedItems = [
    {
      "@type": "diffipedia:GrokipediaArticle",
      label: grok.label,
      preview: grok.preview,
      fingerprint: grok.fingerprint,
      wordCount: grok.wordCount,
      sentenceCount: grok.sentenceCount,
      characterCount: grok.characterCount,
      source:
        metadata?.grokipediaSource ??
        metadata?.sourceA ??
        "grokipedia",
    },
    {
      "@type": "diffipedia:WikipediaArticle",
      label: wiki.label,
      preview: wiki.preview,
      fingerprint: wiki.fingerprint,
      wordCount: wiki.wordCount,
      sentenceCount: wiki.sentenceCount,
      characterCount: wiki.characterCount,
      source:
        metadata?.wikipediaSource ??
        metadata?.sourceB ??
        "wikipedia",
    },
  ];

  return {
    "@context": DEFAULT_CONTEXT,
    "@type": ["Dataset", "diffipedia:DifferenceProfile"],
    name:
      assetMetadata?.title ||
      (title
        ? `${title} – Grokipedia vs Wikipedia Diffipedia Similarity`
        : `${grok.label} vs ${wiki.label} Diffipedia Similarity`),
    description:
      assetMetadata?.description ||
      `Comparison between Grokipedia and Wikipedia articles${title ? ` for "${title}"` : ""}. ${analysis.summary}`,
    dateCreated: analysis.createdAt,
    version: "1.0.0",
    license:
      assetMetadata?.license ||
      "https://creativecommons.org/licenses/by/4.0/",
    metrics: {
      wordSimilarity: analysis.metrics.wordSimilarity.value,
      sentenceSimilarity: analysis.metrics.sentenceSimilarity.value,
      instinctiveSimilarity: analysis.metrics.instinctiveSimilarity.value,
      overallSimilarity: analysis.metrics.overallSimilarity.value,
    },
    sharedVocabularyRatio: analysis.stats.sharedWordRatio,
    comparedItems,
  };
};
