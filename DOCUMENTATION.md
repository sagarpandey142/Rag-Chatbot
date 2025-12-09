# RAG Chatbot Documentation

## Table of Contents
1. [Embeddings: Creation, Indexing, and Storage](#1-embeddings-creation-indexing-and-storage)
2. [Redis Caching & Session History](#2-redis-caching--session-history)
3. [Frontend API Integration](#3-frontend-api-integration)
4. [Design Decisions & Improvements](#4-design-decisions--potential-improvements)

---

## 1. Embeddings: Creation, Indexing, and Storage

### 1.1 Embedding Creation Process

The system uses **Jina AI's embedding model** (`jina-embeddings-v2-base-en`) to convert text into 768-dimensional vector representations. Text is sent to the Jina AI API via RESTful calls, which returns numerical vectors capturing semantic meaning. Similar texts produce vectors that are mathematically close in 768-dimensional space.

**Location:** `backend/services/jina.js`

**Key Details:**
- **Model:** `jina-embeddings-v2-base-en` (pre-trained for English)
- **Vector Size:** 768 dimensions
- **Distance Metric:** Cosine similarity
- **API:** RESTful with Bearer token authentication

### 1.2 Data Seeding & Indexing

**Location:** `backend/services/news.js`

The seeding process has three steps:

1. **Collection Management:** Checks for existing "news" collection in Qdrant, deletes if present, then creates a new collection configured for 768-dimensional vectors using cosine similarity.

2. **Embedding Generation:** Sequentially processes each news article, calling Jina AI API to generate 768-dimensional embeddings.

3. **Batch Insertion:** Creates point objects with ID (integer/UUID), vector (768-dim array), and payload (original text). All points are inserted into Qdrant in one batch operation.

**Important:** Point IDs must be integers or UUIDs (not strings), vector size must match embedding output (768), and payload stores original text for retrieval.

### 1.3 Storage in Qdrant

**Collection Configuration:**
- Name: "news"
- Vector Size: 768 dimensions
- Distance Metric: Cosine similarity
- Storage: Persistent vector database

**Query Process:**
1. **Query Embedding:** User question converted to 768-dim vector using Jina AI
2. **Vector Search:** Qdrant performs cosine similarity search against all stored vectors
3. **Ranking:** Returns top 5 most relevant results with similarity scores (0-1)
4. **Payload Retrieval:** Original text extracted from matched points becomes context for LLM

**Location:** `backend/routes/chat.js` - Retrieved articles form the context for LLM answer generation.

---

## 2. Redis Caching & Session History

### 2.1 Redis Configuration

**Location:** `backend/services/redis.js`

Redis connects via environment variable URL. Automatically enables TLS when URL starts with "rediss://" (secure) vs "redis://" (standard), supporting both local and cloud deployments. Event listeners monitor connection status.

### 2.2 Session Management

**Location:** `backend/routes/chat.js`

- **New Session:** UUID v4 generated on first request without session ID
- **Existing Session:** Client includes `sessionId` in request to continue conversation
- **Storage Key:** `chat:{sessionId}` pattern

Backend checks for session ID, generates UUID if missing, then constructs Redis key.

### 2.3 Conversation History Storage

Redis uses **Lists** to store messages chronologically. Each message stored as JSON string with role ("user"/"bot") and content.

**Storage:**
- User messages appended immediately when received
- Bot responses appended after LLM generation
- Messages maintain chronological order
- Key format: `chat:{sessionId}`

### 2.4 Session Expiration

- **TTL:** 3600 seconds (1 hour)
- **Auto-refresh:** TTL resets with each new message
- **Cleanup:** Redis automatically deletes expired keys

Active conversations persist; abandoned sessions expire after 1 hour of inactivity.

### 2.5 Session History Retrieval

**Endpoint:** `GET /chat/history/:sessionId`

Retrieves all messages from Redis list, parses JSON strings to objects. Returns empty array if session doesn't exist. Currently not used by frontend.

### 2.6 Session Clearing

**Endpoint:** `DELETE /chat/clear/:sessionId`

Deletes entire session key and all conversation history. Called by frontend "Reset" button.

**Note:** Session history is stored but not used in RAG retrieval process (improvement opportunity).

---

## 3. Frontend API Integration

### 3.1 Architecture Overview

**Stack:** React 19.2.0, Axios 1.13.2, Vite. Uses RESTful API (no WebSocket).

### 3.2 API Configuration

**Location:** `frontend/components/Chat.jsx`

API URL configured via `VITE_API_URL` environment variable. Vite requires `VITE_` prefix for environment variables.

### 3.3 Request Flow

**Sending a Message:**
1. **User Input:** Message appears immediately in UI (optimistic update)
2. **Loading:** Input disabled, "Replying..." placeholder added
3. **API Request:** POST with query text and optional session ID
4. **Response:** Session ID stored, placeholder replaced with bot response
5. **Error Handling:** Placeholder replaced with error message on failure

**Request/Response:**
- **Endpoint:** `POST /chat`
- **Request:** `{ "query": "question", "sessionId": "optional-uuid" }`
- **Response:** `{ "sessionId": "uuid", "reply": "answer", "sources": [...] }`

### 3.4 Session Management

- Session ID stored in React state, captured from API responses
- Included in subsequent requests for conversation continuity
- Reset button clears backend session and local UI state

### 3.5 Limitations

- No WebSocket: REST API only, no streaming
- No History Loading: Frontend doesn't fetch history on page load

---

## 4. Design Decisions & Potential Improvements

### 4.1 Current Design Decisions

#### ✅ **Strengths:**
1. **Modular Services:** Separate files for `jina.js`, `qdrant.js`, `redis.js`, `gemini.js`
2. **Environment Config:** All secrets in `.env`, supports local/cloud deployments
3. **Qdrant Choice:** Purpose-built for vector search with efficient cosine similarity
4. **Session Management:** UUID-based sessions with 1-hour TTL
5. **RAG Pipeline:** Clean flow: Embedding → Search → Context → LLM with source citations

### 4.2 Potential Improvements

#### 1. **Conversation Context in RAG**
**Issue:** Session history stored but unused in RAG process.

**Solution:** Retrieve last 3-6 messages from Redis, format as conversation context, include in LLM prompt. Enables contextual follow-ups and conversation continuity.

#### 2. **Embedding Caching**
**Issue:** Every query triggers new Jina AI API call.

**Solution:** Cache embeddings in Redis using query hash as key. Check cache before API calls, store with 24-hour expiration. Reduces costs and improves response time.

#### 3. **WebSocket Streaming**
**Issue:** Users wait for complete response.

**Solution:** Implement WebSocket server to stream LLM responses in chunks. Frontend displays chunks incrementally for better perceived performance.

#### 4. **Batch Embedding Generation**
**Issue:** Sequential embedding generation is slow.

**Solution:** Process embeddings in parallel with concurrency limits (e.g., 5 simultaneous). Reduces seeding time significantly.

#### 5. **Better Error Handling**
**Issue:** Generic error messages.

**Solution:** Specific handling for rate limits (429), API failures, validation errors, timeouts. Return actionable error messages.

#### 6. **Response Quality**
**Issue:** All documents concatenated equally regardless of relevance.

**Solution:** Filter by relevance threshold (>0.7), rank by score, limit to top 3, include scores in context for better LLM focus.

#### 7. **Frontend History Integration**
**Issue:** Conversation lost on page refresh.

**Solution:** Store session ID in localStorage, load history on component mount to restore conversations.

#### 8. **Monitoring & Analytics**
**Solution:** Request logging, performance metrics (response times, error rates), health check endpoints, resource monitoring (Redis memory, API quotas).

#### 9. **Data Validation**
**Issue:** No input validation.

**Solution:** Validate query length (1-1000 chars), session ID UUID format, data types. Return clear validation errors early.

#### 10. **Scaling**
**Current:** Single instance, local caching, sequential processing.

**Future:** Horizontal scaling with load balancer, Redis Cluster for distributed caching, message queues for async operations, CDN for frontend assets.

### 4.3 Production Recommendations

1. API Gateway with rate limiting and authentication
2. Persistent storage for conversation history
3. Application Performance Monitoring (APM)
4. Unit and integration tests
5. API documentation (Swagger/OpenAPI)
6. CI/CD pipeline

---

## Summary

This RAG chatbot implements clean separation between:
- **Embedding generation** (Jina AI)
- **Vector storage & search** (Qdrant)
- **Session management** (Redis)
- **LLM responses** (Gemini)
- **Frontend interface** (React)

Well-structured for small-scale deployment with clear improvement paths for scalability, real-time features, and enhanced context utilization.
