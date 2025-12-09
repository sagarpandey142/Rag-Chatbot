

import express from "express";
import { qdrant } from "../services/qdrant.js";
import { getEmbedding } from "../services/jina.js";
import { geminiReply } from "../services/gemini.js";
import redis from "../services/redis.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { query, message, text, sessionId } = req.body;

    const userQuery = query || message || text;

    if (!userQuery) {
      return res.status(400).json({ error: "Query is required" });
    }

    
    if (!sessionId) {
      sessionId = uuidv4();
    }

    const redisKey = `chat:${sessionId}`;

   
    await redis.rpush(redisKey, JSON.stringify({
      role: "user",
      content: userQuery
    }));

  
    const queryEmbedding = await getEmbedding(userQuery);

   
    const searchResults = await qdrant.search("news", {
      vector: queryEmbedding,
      limit: 5,
      with_payload: true
    });

    const context = searchResults
      .map(r => r.payload?.text || "")
      .join("\n");

    
    const prompt = `
            Use the context below to answer the user query.

            Context:
            ${context}

            User Question:
            ${userQuery}
            `;

    const aiAnswer = await geminiReply(prompt);

  
    await redis.rpush(redisKey, JSON.stringify({
      role: "bot",
      content: aiAnswer
    }));

    await redis.expire(redisKey, 3600);

    res.json({
      sessionId,
      reply: aiAnswer,
      sources: searchResults.map(r => ({
        score: r.score,
        text: r.payload?.text
      }))
    });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/history/:sessionId", async (req, res) => {
  const data = await redis.lrange(`chat:${req.params.sessionId}`, 0, -1);
  res.json(data.map(JSON.parse));
});



router.delete("/clear/:sessionId", async (req, res) => {
  await redis.del(`chat:${req.params.sessionId}`);
  res.json({ message: "Session cleared" });
});

export default router;
