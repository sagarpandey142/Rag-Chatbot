import fetch from "node-fetch";
import dotenv from "dotenv"
dotenv.config()
export async function geminiReply(prompt) {
  const API_KEY = process.env.GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    })
  });

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]) {
    console.error("Gemini raw response:", data);
    return "Sorry, AI could not generate a response.";
  }

  return data.candidates[0].content.parts[0].text;
}
