export type DiffTextDescriptor = {
  label: string;
  content: string;
  reference?: string;
};

export type DiffMetadata = {
  tags?: string[];
  domain?: string;
  grokipediaSource?: string;
  wikipediaSource?: string;
  /** @deprecated use grokipediaSource */
  sourceA?: string;
  /** @deprecated use wikipediaSource */
  sourceB?: string;
  externalIds?: string[];
  creator?: {
    name?: string;
    url?: string;
  };
  license?: string;
  custom?: Record<string, string | number | boolean>;
};

export type DiffComparisonInput = {
  grokipediaArticle: string;
  wikipediaArticle: string;
  title?: string;
  metadata?: DiffMetadata;
};

export type DiffMetricValue = {
  value: number;
  percentage: number;
  technique: string;
};

export type DiffMetrics = {
  wordSimilarity: DiffMetricValue;
  sentenceSimilarity: DiffMetricValue;
  instinctiveSimilarity: DiffMetricValue;
  overallSimilarity: DiffMetricValue;
};

export type DiffItemProfile = {
  label: string;
  source: "grokipedia" | "wikipedia";
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  preview: string;
  fingerprint: string;
};

export type DiffStats = {
  sharedWordRatio: number;
  sharedWords: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  tokensA: number;
  tokensB: number;
  sentencesA: number;
  sentencesB: number;
  charLengthA: number;
  charLengthB: number;
};

export type DiffAnalysisResult = {
  id: string;
  createdAt: string;
  compared: {
    a: DiffItemProfile;
    b: DiffItemProfile;
  };
  metrics: DiffMetrics;
  stats: DiffStats;
  summary: string;
};

export type DiffAssetMetadata = {
  title?: string;
  description?: string;
  tags?: string[];
  externalIds?: string[];
  dataSource?: string;
  knowledgeDomain?: string;
  sourceAuthor?: string;
  license?: string;
  creator?: {
    name?: string;
    url?: string;
    identifier?: string;
  };
  custom?: Record<string, unknown>;
};

export type DiffPublishOptions = {
  epochsNum?: number;
  minimumNumberOfFinalizationConfirmations?: number;
  minimumNumberOfNodeReplications?: number;
};

export type DiffPersistOptions = {
  persist?: boolean; // legacy flag
  recordAsset?: boolean;
  privacy?: "private" | "public";
  publishOptions?: DiffPublishOptions;
  assetMetadata?: DiffAssetMetadata;
};

export type DiffRequestPayload = DiffComparisonInput & DiffPersistOptions;

export type KnowledgeAssetPayload = {
  analysis: DiffAnalysisResult;
  assetMetadata?: DiffAssetMetadata;
  metadata?: DiffMetadata;
  grokipediaArticle: string;
  wikipediaArticle: string;
  title?: string;
};

export type PublishResult = {
  ual: string | null;
};
