declare module "wink-nlp/utilities/similarity.js" {
    type BagOfWords = Record<string, number>;
    type SimilarityVector = number[];

    interface Similarity {
        bow: {
            cosine(bowA: BagOfWords, bowB: BagOfWords): number;
        };
        set: {
            tversky(
                setA: Set<string>,
                setB: Set<string>,
                alpha?: number,
                beta?: number,
            ): number;
            oo(setA: Set<string>, setB: Set<string>): number;
        };
        vector: {
            cosine(vectorA: SimilarityVector, vectorB: SimilarityVector): number;
        };
    }

    const similarity: Similarity;
    export default similarity;
}
