// import { qdrant } from "../services/qdrant.js";
// import { getEmbedding } from "../services/jina.js";
// import { news } from "../services/news.js";

// const store = async () => {
//   // Delete existing collection if it exists
//   const collections = await qdrant.getCollections();
//   const exists = collections.collections.some(c => c.name === "news");
//   if (exists) {
//     await qdrant.deleteCollection("news");
//     console.log("⚠️ Old collection deleted");
//   }

//   // Create new collection with correct vector size
//   await qdrant.createCollection("news", {
//     vectors: {
//       size: 768,      // ✅ match Jina embedding size
//       distance: "Cosine",
//     },
//   });
//   console.log("✅ Collection created");

//   // Store news items
//   for (const item of news) {
//     const vector = await getEmbedding(item.text);

//     await qdrant.upsert("news", {
//       points: [
//         {
//           id: item.id,   // id should be integer (or UUID string)
//           vector,                  // 768-dim
//           payload: { text: item.text },
//         },
//       ],
//     });

//     console.log(`✅ Stored: ${item.text}`);
//   }
// };

// store();
