import { fetch } from "undici"; 
import dotenv from "dotenv"
dotenv.config()

export const getEmbedding = async (text) => {
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v2-base-en",
        input: [text],
      }),
    });

    const data = await res.json();
    console.log("Jina API response:", JSON.stringify(data, null, 2)); 

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Failed to fetch embedding from Jina API");
    }

    return data.data[0].embedding;
  } catch (err) {
    console.error("Error fetching embedding:", err);
    throw err;
  }
};
