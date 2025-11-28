import { defineDkgPlugin, type DkgContext } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import { calculateDiffAnalysis } from "./similarity";
import { buildDiffKnowledgeAsset } from "./jsonld";
import type {
  DiffRequestPayload,
  DiffAnalysisResult,
  PublishResult,
} from "./types";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const scalarRecord = z.record(z.union([z.string(), z.number(), z.boolean()]));

const metadataSchema = z
  .object({
    tags: z.array(z.string()).max(40).optional(),
    domain: z.string().max(120).optional(),
    sourceA: z.string().max(280).optional(),
    sourceB: z.string().max(280).optional(),
    externalIds: z.array(z.string()).max(10).optional(),
    creator: z
      .object({
        name: z.string().optional(),
        url: z.string().url().optional(),
      })
      .optional(),
    license: z.string().optional(),
    custom: scalarRecord.optional(),
  })
  .optional();

const assetMetadataSchema = z
  .object({
    title: z.string().max(180).optional(),
    description: z.string().max(2048).optional(),
    tags: z.array(z.string()).max(40).optional(),
    externalIds: z.array(z.string()).max(10).optional(),
    dataSource: z.string().optional(),
    knowledgeDomain: z.string().optional(),
    sourceAuthor: z.string().optional(),
    license: z.string().optional(),
    creator: z
      .object({
        name: z.string().optional(),
        url: z.string().url().optional(),
        identifier: z.string().optional(),
      })
      .optional(),
    custom: z.record(z.any()).optional(),
  })
  .optional();

const publishOptionsSchema = z
  .object({
    epochsNum: z.number().int().min(1).max(12).optional(),
    minimumNumberOfFinalizationConfirmations: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional(),
    minimumNumberOfNodeReplications: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional(),
  })
  .optional();

const compareSchema = z.object({
  grokipediaArticle: z.string().min(1),
  wikipediaArticle: z.string().min(1),
  title: z.string().max(120).optional(),
  metadata: metadataSchema,
  persist: z.boolean().optional().default(false),
  recordAsset: z.boolean().optional().default(false),
  privacy: z.enum(["private", "public"]).optional().default("private"),
  publishOptions: publishOptionsSchema,
  assetMetadata: assetMetadataSchema,
});

const getAssetSchema = z.object({
  ual: z
    .string()
    .min(10)
    .regex(/^did:dkg:/i, "Expected DID that starts with did:dkg:"),
});

const DEFAULT_PUBLISH_OPTIONS = {
  epochsNum: 2,
  minimumNumberOfFinalizationConfirmations: 3,
  minimumNumberOfNodeReplications: 1,
};

type DiffipediaAsset = ReturnType<typeof buildDiffKnowledgeAsset>;

type DiffComparisonResponse = {
  analysis: DiffAnalysisResult;
  jsonld: DiffipediaAsset;
  recorded: boolean;
  persisted: boolean;
  ual: string | null;
};

const persistDiffAnalysis = async (
  ctx: DkgContext,
  asset: DiffipediaAsset,
  payload: DiffRequestPayload,
): Promise<PublishResult> => {
  console.log("[Diffipedia] Preparing knowledge asset payload...");
  const privacy = payload.privacy || "private";
  const publishOptions = {
    ...DEFAULT_PUBLISH_OPTIONS,
    ...(payload.publishOptions || {}),
  };

  console.log(
    "[Diffipedia] Publishing asset to DKG:",
    JSON.stringify({
      privacy,
      publishOptions,
      hasMetadata: Boolean(payload.metadata),
      hasAssetMetadata: Boolean(payload.assetMetadata),
    }),
  );

  const result = await ctx.dkg.asset.create({ [privacy]: asset }, publishOptions);
  console.log(
    "[Diffipedia] Asset publish finished:",
    result?.UAL ? `UAL=${result.UAL}` : "no UAL returned",
  );
  return { ual: result?.UAL || null };
};

const formatMcpResponse = (
  analysis: DiffAnalysisResult,
  ual?: string | null,
): CallToolResult["content"] => {
  const lines = [
    `Diffipedia Grokipedia vs Wikipedia similarity for ${analysis.compared.a.label} vs ${analysis.compared.b.label}`,
    `Word Similarity: ${analysis.metrics.wordSimilarity.percentage}%`,
    `Sentence Similarity: ${analysis.metrics.sentenceSimilarity.percentage}%`,
    `Instinctive Similarity: ${analysis.metrics.instinctiveSimilarity.percentage}%`,
    `Overall Similarity: ${analysis.metrics.overallSimilarity.percentage}%`,
    `Vocabulary Overlap: ${analysis.stats.sharedWordRatio.toFixed(2)} (${analysis.stats.sharedWords.length} shared terms)`,
  ];

  if (ual) {
    lines.push(`Knowledge Asset DID: ${ual}`);
  }

  return [
    { type: "text", text: lines.join("\n") },
    {
      type: "text",
      text: JSON.stringify(analysis, null, 2),
    },
  ];
};

export default defineDkgPlugin((ctx, mcp, api) => {
  const executeComparison = async (
    payload: DiffRequestPayload,
  ): Promise<DiffComparisonResponse> => {
    const analysis = await calculateDiffAnalysis(payload);
    const jsonld = buildDiffKnowledgeAsset({
      analysis,
      metadata: payload.metadata,
      assetMetadata: payload.assetMetadata,
      grokipediaArticle: payload.grokipediaArticle,
      wikipediaArticle: payload.wikipediaArticle,
      title: payload.title,
    });
    let ual: string | null = null;
    const shouldRecord = payload.recordAsset ?? payload.persist ?? false;

    if (shouldRecord) {
      const publishResult = await persistDiffAnalysis(ctx, jsonld, payload);
      ual = publishResult.ual;
    }

    return {
      analysis,
      jsonld,
      recorded: Boolean(ual),
      persisted: Boolean(ual), // legacy field
      ual,
    };
  };

  api.post(
    "/diffipedia/compare",
    openAPIRoute(
      {
        tag: "Diffipedia",
        summary: "Compute similarity metrics between two texts",
        body: compareSchema,
        response: {
          schema: z.object({
            analysis: z.object({}).passthrough(),
            jsonld: z.object({}).passthrough(),
            recorded: z.boolean(),
            persisted: z.boolean().optional(),
            ual: z.string().nullable(),
          }),
        },
      },
      async (req, res) => {
        const payload = req.body as DiffRequestPayload;
        console.log(
          "[Diffipedia] Incoming comparison request:",
          JSON.stringify({
            hasTitle: Boolean(payload.title),
            recordAsset: payload.recordAsset ?? payload.persist ?? false,
            privacy: payload.privacy,
          }),
        );
        const result = await executeComparison(payload);
        console.log(
          "[Diffipedia] Comparison completed:",
          JSON.stringify({
            recorded: result.recorded,
            ual: result.ual,
          }),
        );
        res.status(200).json(result);
      },
    ),
  );

  api.get(
    "/diffipedia/assets/:ual",
    openAPIRoute(
      {
        tag: "Diffipedia",
        summary: "Fetch a knowledge asset by DID",
        params: getAssetSchema,
        response: {
          schema: z.object({
            data: z.object({}).passthrough(),
          }),
        },
      },
      async (req, res) => {
        const params = req.params as z.infer<typeof getAssetSchema>;
        const ual = params.ual.toLowerCase();
        const asset = await ctx.dkg.asset.get(ual, { includeMetadata: true });
        res.json({ data: asset });
      },
    ),
  );

  mcp.registerTool(
    "diffipedia-compare",
    {
      title: "Diffipedia Similarity",
      description:
        "Compare two textual inputs, return similarity metrics, and optionally persist them as a knowledge asset on the DKG.",
      inputSchema: compareSchema.shape,
    },
    async (input) => {
      const payload = compareSchema.parse(input);
      const result = await executeComparison(payload);
      return {
        content: formatMcpResponse(result.analysis, result.ual),
      };
    },
  );

  mcp.registerTool(
    "diffipedia-get-asset",
    {
      title: "Fetch Diffipedia Knowledge Asset",
      description: "Retrieve a Diffipedia analysis knowledge asset by DID.",
      inputSchema: getAssetSchema.shape,
    },
    async ({ ual }) => {
      const asset = await ctx.dkg.asset.get(ual.toLowerCase(), {
        includeMetadata: true,
      });
      const content: CallToolResult["content"] = [
        { type: "text", text: JSON.stringify(asset, null, 2) },
      ];
      return {
        content,
      };
    },
  );
});
