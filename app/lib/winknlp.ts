import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import similarity from "wink-nlp/utilities/similarity.js";

const nlp = winkNLP(model);

const its = nlp.its;
const as = nlp.as;

export class WinkNLP {
    static computeSimilarities(content1: string, content2: string) {
        const doc1 = nlp.readDoc(content1);
        const doc2 = nlp.readDoc(content2);

        const bow1 = doc1.tokens().out(its.value, as.bow) as Record<string, number>;
        const set1 = doc1.tokens().out(its.value, as.set) as Set<string>;

        const bow2 = doc2.tokens().out(its.value, as.bow) as Record<string, number>;
        const set2 = doc2.tokens().out(its.value, as.set) as Set<string>;

        const cosineSimilarity = similarity.bow.cosine(bow1, bow2);
        const tverskySimilarity = similarity.set.tversky(set1, set2, 0.5, 0.5);
        const overlapCoefficient = similarity.set.oo(set1, set2);

        return {
            cosineSimilarity,
            tverskySimilarity,
            overlapCoefficient,
            overallSimilarity:
                cosineSimilarity * 0.25 + tverskySimilarity * 0.35 + overlapCoefficient * 0.4,
        };
    }
}
