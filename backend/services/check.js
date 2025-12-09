import { qdrant } from "./qdrant.js";

const checkCollection = async () => {
  const result = await qdrant.scroll("news", { limit: 5 }); 
  console.log("Sample points in 'news':", result.points);
};

checkCollection();
