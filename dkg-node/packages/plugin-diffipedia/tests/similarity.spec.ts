import { describe, it } from "mocha";
import { expect } from "chai";
import {
  calculateDiffAnalysis,
  wordSimilarity,
  sentenceSimilarity,
  instinctiveSimilarity,
} from "../src/similarity";
import { buildDiffKnowledgeAsset } from "../src/jsonld";

describe("Diffipedia similarity helpers", () => {
  it("returns perfect scores for identical texts", async () => {
    const text = "Origins of knowledge are rooted in verifiable evidence.";
    expect(wordSimilarity(text, text)).to.equal(1);
    expect(sentenceSimilarity(text, text)).to.equal(1);
    expect(await instinctiveSimilarity(text, text)).to.equal(1);
  });

  it("returns low similarity for divergent texts", async () => {
    const a = "The spacecraft entered orbit around Mars after a seven-month journey.";
    const b = "Bananas grow best in humid tropical climates with rich soil.";
    expect(wordSimilarity(a, b)).to.be.lessThan(0.2);
    expect(sentenceSimilarity(a, b)).to.be.lessThan(0.3);
    expect(await instinctiveSimilarity(a, b)).to.be.lessThan(0.5);
  });

  it("calculates a rich analysis payload", async () => {
    const analysis = await calculateDiffAnalysis({
      grokipediaArticle:
        "OriginTrail enables trusted knowledge verification across multi-stakeholder ecosystems.",
      wikipediaArticle:
        "OriginTrail builds a decentralized knowledge graph to verify AI workflows.",
      title: "OriginTrail Comparison",
    });

    expect(analysis.compared.a.label).to.equal("OriginTrail Comparison (Grokipedia)");
    expect(analysis.compared.a.source).to.equal("grokipedia");
    expect(analysis.compared.b.label).to.equal("OriginTrail Comparison (Wikipedia)");
    expect(analysis.compared.b.source).to.equal("wikipedia");
    expect(analysis.metrics.overallSimilarity.value).to.be.greaterThan(0);
    expect(analysis.metrics.overallSimilarity.value).to.be.at.most(1);
    expect(analysis.summary).to.include("Grokipedia OriginTrail Vision");
  });

  it("generates a JSON-LD payload suitable for publishing", async () => {
    const analysis = await calculateDiffAnalysis({
      grokipediaArticle: "Grokipedia documents Diffipedia comparisons.",
      wikipediaArticle: "Wikipedia documents Diffipedia comparisons.",
      title: "Diffipedia Docs",
    });

    const asset = buildDiffKnowledgeAsset({
      analysis,
      grokipediaArticle: "Grokipedia documents Diffipedia comparisons.",
      wikipediaArticle: "Wikipedia documents Diffipedia comparisons.",
      title: "Diffipedia Docs",
    });

    expect(asset["@context"]).to.be.an("array");
    expect(asset["@type"]).to.include("diffipedia:DifferenceProfile");
    expect(asset.diffipedia.metrics.wordSimilarity).to.equal(
      analysis.metrics.wordSimilarity.value,
    );
  });
});

