import { qdrant } from "./qdrant.js";
import { getEmbedding } from "./jina.js";
import dotenv from "dotenv";
dotenv.config();

// News data to seed the database
export const news = [
  {
    id: 1,
    text: `
The global stock markets saw significant movement today as major indices reacted to fresh economic data. 
Investors showed confidence in technology and healthcare stocks, while energy-related stocks faced slight declines. 
Experts suggest that inflation trends and central bank policies will continue to influence market behavior in the coming weeks.
`
  },
  {
    id: 2,
    text: `
Breaking News: A powerful earthquake measuring 6.8 magnitude struck a coastal region early this morning. 
Emergency services were immediately dispatched, and rescue operations are ongoing. 
Authorities have urged residents to stay alert for possible aftershocks while damage assessments are being carried out.
`
  },
  {
    id: 3,
    text: `
Technology Update: Artificial intelligence is rapidly transforming industries across the globe. 
Major companies are investing heavily in AI-driven automation, machine learning, and data analytics. 
Experts believe that AI will continue to create new job opportunities while also requiring workers to adapt to new skill demands.
`
  },
  {
    id: 4,
    text: `
Space Exploration News: A leading space agency successfully launched a new satellite designed to study deep space. 
The satellite will focus on mapping distant galaxies and collecting data on cosmic radiation. 
Scientists expect this mission to provide valuable insights into the origins of the universe.
`
  },
  {
    id: 5,
    text: `
Health Report: Global health organizations have released updated guidelines for managing pandemic outbreaks. 
The focus remains on vaccination, improved healthcare infrastructure, and early detection of new variants. 
Medical experts stress the importance of public awareness and preventive measures to reduce the spread of infectious diseases.
`
  },
];

const seed = async () => {
  try {
 
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === "news");
    if (exists) {
      await qdrant.deleteCollection("news");
      console.log("⚠️ Old collection deleted");
    }

    await qdrant.createCollection("news", {
      vectors: { size: 768, distance: "Cosine" },
    });
    console.log("✅ Collection created");

   
    const points = [];
    for (let i = 0; i < news.length; i++) {
      console.log(`Generating embedding for: ${news[i].text}`);
      const embedding = await getEmbedding(news[i].text);
      points.push({
        id: news[i].id, 
        vector: embedding,
        payload: { text: news[i].text },
      });
    }

    await qdrant.upsert("news", {
      points,
    });
    console.log(`✅ Seeded Qdrant with ${points.length} points`);
  } catch (err) {
    console.error("Error seeding Qdrant:", err);
  }
};


seed();
