import { qdrant } from "./qdrant.js";

export const createCollection = async () => {
  // Delete the old collection if it exists
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === "news");

  if (exists) {
    await qdrant.deleteCollection("news");
    console.log("⚠️ Old collection deleted");
  }

 
  await qdrant.createCollection("news", {
    vectors: {
      size: 768,      
      distance: "Cosine",
    },
  });

  console.log("✅ Collection created");
};
