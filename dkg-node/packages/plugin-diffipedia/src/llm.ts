import Anthropic from "@anthropic-ai/sdk";
import { clamp } from "./math.js";

type InstinctivePromptInput = {
  grokipediaArticle: string;
  wikipediaArticle: string;
  title: string;
  heuristics: {
    charScore: number;
    lengthScore: number;
    structureScore: number;
    punctuationScore: number;
    fallback: number;
  };
  stats: {
    wordSimilarity: number;
    sentenceSimilarity: number;
    sharedVocabularyRatio: number;
  };
};

const INSTINCTIVE_SYSTEM_PROMPT = `
You are Diffipedia's instinctive similarity engine.
Estimate an overall "instinctive similarity" score between a Grokipedia article and a Wikipedia article on a 0-1 scale where:
- 0 represents entirely different content, tone, cadence, and structure.
- 0.5 indicates notable thematic overlap but divergent voice/structure.
- 1.0 represents virtually identical cadence, tone, and narrative structure.

You must ONLY return JSON in the following format:
{
  "instinctiveSimilarity": <number between 0 and 1>,
  "confidence": <number between 0 and 1>,
  "rationale": "<one short sentence>"
}

Use the heuristics provided as hints, but override them when your qualitative judgement differs.
`.trim();

const toPrompt = (input: InstinctivePromptInput) => `
Grokipedia Article (${input.title}):
"""
${input.grokipediaArticle}
"""

Wikipedia Article (${input.title}):
"""
${input.wikipediaArticle}
"""

Heuristic signals (0-1):
- Character overlap (dice): ${input.heuristics.charScore.toFixed(3)}
- Length balance: ${input.heuristics.lengthScore.toFixed(3)}
- Structural alignment: ${input.heuristics.structureScore.toFixed(3)}
- Punctuation cadence: ${input.heuristics.punctuationScore.toFixed(3)}
- Aggregated fallback: ${input.heuristics.fallback.toFixed(3)}

Semantic context:
- Word similarity: ${input.stats.wordSimilarity.toFixed(3)}
- Sentence similarity: ${input.stats.sentenceSimilarity.toFixed(3)}
- Shared vocabulary ratio: ${input.stats.sharedVocabularyRatio.toFixed(3)}

Judge instinctive similarity holistically and respond with the required JSON only.
`.trim();

let anthropicClient: Anthropic | null = null;

const getAnthropicClient = () => {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Diffipedia LLM scoring.");
  }
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
};

export const isAnthropicProviderEnabled = () =>
  (process.env.LLM_PROVIDER || "").toLowerCase() === "anthropic" &&
  Boolean(process.env.ANTHROPIC_API_KEY);

const extractJson = (raw: string) => {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response missing JSON payload.");
  }
  return raw.slice(start, end + 1);
};

export const fetchInstinctiveSimilarity = async (
  input: InstinctivePromptInput,
) => {
  const client = getAnthropicClient();
  const model = process.env.LLM_MODEL || "claude-sonnet-4-5-20250929";

  const response = await client.messages.create({
    system: INSTINCTIVE_SYSTEM_PROMPT,
    model,
    max_tokens: 512,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: toPrompt(input),
      },
    ],
  });

  const textBlocks = response.content
    .filter((block) => block.type === "text")
    .map((block) => ("text" in block ? block.text : ""))
    .join("\n");

  const parsed = JSON.parse(extractJson(textBlocks));
  const score =
    typeof parsed.instinctiveSimilarity === "number"
      ? parsed.instinctiveSimilarity
      : parsed.score ?? parsed.value;

  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new Error("LLM response did not include a numeric instinctiveSimilarity.");
  }

  return {
    score: clamp(score),
    confidence:
      typeof parsed.confidence === "number"
        ? clamp(parsed.confidence)
        : undefined,
    rationale:
      typeof parsed.rationale === "string"
        ? parsed.rationale.slice(0, 280)
        : undefined,
  };
};

