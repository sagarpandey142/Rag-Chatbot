import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv"
dotenv.config()

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

export const createNewsCollection = async () => {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === "news");

  if (exists) {
    console.log("✅ Collection already exists");
    return;
  }

  await qdrant.createCollection("news", {
    vectors: {
      size: 768,
      distance: "Cosine",
    },
  });

  console.log("✅ Collection created");
};

