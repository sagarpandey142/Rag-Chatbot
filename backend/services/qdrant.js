import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

export const createNewsCollection = async () => {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === "news");

  if (exists) {
    await qdrant.deleteCollection("news");
    console.log("⚠️ Old collection deleted");
  }

  await qdrant.createCollection("news", {
    vectors: {
      size: 768, // Must match Jina embeddings
      distance: "Cosine",
    },
  });

  console.log("✅ Collection created");
};
