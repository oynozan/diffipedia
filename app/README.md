# Diffipedia

## Development Environment Setup
1. Clone the repository:
   ```bash
    git clone https://github.com/oynozan/diffipedia.git
    cd diffipedia
    ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Rename the `.env.template` file to `.env` and set your environment variables as needed.

4. Provide proxy list:
   - Create a directory named `proxy` inside the `lib` folder.
   - Inside the `proxy` folder, create a file named `list.txt`.
   - Add your proxy URLs to `list.txt`, one per line.
   - Proxy format is: `IP:PORT:USERNAME:PASSWORD`

## API Endpoints

### `POST /api/compare`
- **Purpose**: Returns a weighted aggregate similarity score (80% DKG, 20% wink-nlp) plus each engine’s score distribution and any DKG-provided JSON-LD.
- **Request Body**: `{ "grokipedia": string, "wikipedia": string }` (both required).
- **Success Response**: `{ score, score_distibution: { winknlp, dkg }, weights: { winknlp: 0.2, dkg: 0.8 }, jsonld|null }`.
- **Error Responses**: `400` with `status:false` if either article is missing; otherwise `{ status:false, message: "Failed to compute comparison results" }`.

### `POST /api/compare/winknlp`
- **Purpose**: Exposes the raw wink-nlp similarity metrics (cosine, Tversky, overlap, overall, etc.).
- **Request Body**: `{ "grokipedia": string, "wikipedia": string }` (both required).
- **Success Response**: `{ score, scoreDistribution }`, where `scoreDistribution` contains all wink metrics.
- **Error Responses**: `400` for missing fields; `{ status:false, message: "Failed to compute wink-nlp comparison results" }` otherwise.

### `POST /api/compare/dkg`
- **Purpose**: Exposes the raw DKG engine output, including word/sentence/instinctive/overall similarity metrics and optional JSON-LD.
- **Request Body**: `{ "grokipedia": string, "wikipedia": string }` (both required).
- **Success Response**: `{ score, scoreDistribution: { wordSimilarity, sentenceSimilarity, instinctiveSimilarity, overallSimilarity }, jsonld|null }`.
- **Error Responses**: `400` for missing fields; `{ status:false, message: "Failed to compute DKG comparison results" }` otherwise.