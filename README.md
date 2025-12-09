🧠 Rag-Chatbot

A Retrieval-Augmented Generation (RAG) Chatbot that answers user queries intelligently using pre-indexed knowledge, embeddings, and semantic search. It combines a vector database (Qdrant) for retrieval, Redis for session caching, and a modern frontend for real-time chat.

✨ Features

Semantic search with embeddings

Fast vector similarity search using Qdrant

Conversation session history using Redis

Real-time chat with WebSocket support

REST APIs for chat and retrieval

Intelligent answers powered by LLMs (via embeddings + retrieval)

🏗️ How It Works
1. Backend
Embeddings

Text documents or news articles are converted into vector representations using the Jina embeddings model (jina-embeddings-v2-base-en) or any other embedding model.

Each text chunk becomes a high-dimensional vector capturing its semantic meaning.

Indexing & Storage

Embeddings are stored in Qdrant, a vector database optimized for nearest neighbor search.

Each vector is stored with metadata (document ID, title, source).

Example structure:

{
  "id": "doc_001",
  "vector": [0.012, -0.031, 0.054, ...],
  "payload": {
    "title": "Example Document",
    "source": "NewsAPI"
  }
}

Redis Cache

Stores session history per user and optionally cached embeddings for faster response.

Example:

await redisClient.rPush(`session:${userId}`, JSON.stringify({ role: "user", content: "Hello" }));
const messages = await redisClient.lRange(`session:${userId}`, 0, -1);

API & Socket

REST API endpoints accept user messages and return responses.

WebSockets allow real-time responses, updating the frontend as soon as AI generates a reply.

2. Frontend

Built with React / Next.js, the frontend allows users to chat in real-time.

Fetches chat responses from backend via REST API or WebSocket.

Maintains local chat state for smooth UI experience.

Example API call:

const response = await fetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message: userMessage }),
});
const data = await response.json();


Example WebSocket:

socket.on("bot-response", (data) => {
    addMessageToChat(data);
});

3. Flow Diagram
User → Frontend → REST API / WebSocket → Backend
       ↓                               ↓
    Session Cache (Redis) ← Embeddings → Vector DB (Qdrant)
       ↓
    AI Response → Frontend → User

🚀 How to Run
1. Backend

Install dependencies:

cd backend
npm install


Create .env with:

GEMINI_API_KEY= your key
PORT=5000
JINA_API_KEY=your key
REDIS_URL=your Url 
QDRANT_URL= your Url 
QDRANT_API_KEY= your key 



Start backend server:

node index.js

2. Frontend

Install dependencies:

cd frontend
npm install


Create .env with:

VITE_API_URL="http://localhost:5000/chat"

Run development server:

npm run dev


Open browser at http://localhost:3000

📝 Design Decisions

Vector database (Qdrant): Chosen for fast similarity search.

Redis: Keeps session history, reducing repeated embeddings retrieval.

Chunking documents: Improves retrieval accuracy.

Real-time chat with WebSocket: Smooth, responsive UI.
