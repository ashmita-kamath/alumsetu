// Text similarity using TF-IDF vectors and cosine similarity.
// Written from scratch (no library) so every step can be explained.
//
// Idea: turn each piece of text into a vector of word weights, then measure
// the angle between two vectors. Same direction = similar meaning (score 1),
// nothing in common = score 0.

// Common words that carry no meaning for matching careers.
const STOP_WORDS = new Set([
  "a", "an", "and", "the", "of", "in", "on", "at", "for", "to", "with", "as", "by",
  "is", "are", "be", "i", "my", "me", "we", "our", "want", "wants", "like", "would",
  "become", "work", "working", "job", "role", "career", "company", "companies", "field",
]);

// "Data Engineers at a Product-Company!" -> ["data", "engineer", "product"]
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/) // keep "c++" and "c#" intact
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word));
}

// Term frequency: how often each word appears in one document, divided by its length.
function termFrequency(tokens) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  for (const [token, count] of counts) counts.set(token, count / tokens.length);
  return counts;
}

// Inverse document frequency: rare words across all documents get a higher weight.
// Smoothed so a word that appears everywhere still keeps a small positive weight.
function inverseDocumentFrequency(tokenizedDocs) {
  const docCount = tokenizedDocs.length;
  const docsContaining = new Map();
  for (const tokens of tokenizedDocs) {
    for (const token of new Set(tokens)) {
      docsContaining.set(token, (docsContaining.get(token) || 0) + 1);
    }
  }
  const idf = new Map();
  for (const [token, count] of docsContaining) {
    idf.set(token, Math.log((docCount + 1) / (count + 1)) + 1);
  }
  return idf;
}

// Builds one TF-IDF vector (a Map of word -> weight) per document.
export function tfidfVectors(texts) {
  const tokenizedDocs = texts.map(tokenize);
  const idf = inverseDocumentFrequency(tokenizedDocs);
  return tokenizedDocs.map((tokens) => {
    const vector = new Map();
    if (tokens.length === 0) return vector;
    for (const [token, tf] of termFrequency(tokens)) vector.set(token, tf * idf.get(token));
    return vector;
  });
}

// Cosine similarity between two vectors: dot product / (length A * length B).
// Returns a number from 0 (nothing shared) to 1 (identical direction).
export function cosineSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  for (const [token, weight] of a) {
    if (b.has(token)) dot += weight * b.get(token);
  }
  const length = (v) => Math.sqrt([...v.values()].reduce((sum, w) => sum + w * w, 0));
  return dot / (length(a) * length(b));
}
