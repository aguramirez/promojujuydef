# Promo Jujuy — Production-Grade, Automated AI Promotion Portal

Promo Jujuy is a production-ready, AI-driven promotional portal built to solve commercial discovery in the province of Jujuy, Argentina. Local merchants publish daily promotions and weekend events on Instagram, which are scraped, classified, extracted, semantically deduplicated, and displayed on this platform. The project serves a live community of over **2,500+ followers** on Instagram and TikTok.

This repository serves as a portfolio piece demonstrating senior-level software architecture, multimodal multi-agent pipelines, database-level semantic deduplication (RAG), and strict serverless optimization paradigms.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Instagram Profiles] -->|Cron Scheduler| B[Apify IG Scraper Actor]
    B -->|Raw JSON Posts| C[Ingestion API Route]
    C -->|Image + Caption| D[LangGraph State Workflow]
    
    subgraph LangGraph Pipeline
        D --> E[Classify Node: PROMOTION vs EVENT vs NONE]
        E -->|PROMOTION / EVENT| F[Extraction Node: Structured JSON Extraction]
        E -->|NONE| G[Discard Post]
        F --> H[Validate Node: Programmatic Field Check]
    end
    
    H -->|Valid State| I[Gemini Embedding Generator]
    I -->|768d Vector| J[Neon pgvector similarity search]
    J -->|Similarity > 0.85| K[Discard Duplicate]
    J -->|Similarity <= 0.85| L[Prisma Client Insert]
    L --> M[(Neon PostgreSQL DB)]
    
    N[Public Web Client] -->|Fetch Cached Data| O[Next.js ISR Cache]
    O -->|Stale Check| M
    P[User UI] -->|Query Prompt| Q[Chat API Route]
    Q -->|Compact JSON context| R[Gemini Fallback Chain]
    R -->|Argentine Spanish Response| P
```

---

## 🛠️ Key Technical Features & Senior Decisions

### 1. Multimodal Multi-Agent Extraction (LangGraph)
*   **Decoupled State Pipeline**: Rather than relying on monolithic, error-prone prompt structures, the ingestion pipeline uses a [LangGraph StateGraph](./src/lib/agents/workflow.ts) to orchestrate classification, extraction, and validation.
*   **Multimodal Input Processing**: The `classifyNode` and `extractNode` fetch and compress post images into WebP formats, converting them to Base64 to feed directly into `gemini-2.5-flash`. This allows the AI to capture critical discount details embedded inside promotional graphics instead of relying solely on caption text.
*   **Strong Type Guarantees**: Utilizes `withStructuredOutput` combined with typed [Zod schemas](./src/lib/agents/workflow.ts) to guarantee structural integrity before data reaches database models.

### 2. Semantic Deduplication via pgvector & RAG
*   To prevent duplicate items (e.g., merchants reposting the same flyer repeatedly), we compute a 768-dimensional vector representation of the item using the `gemini-embedding-2` model via [embeddings.ts](./src/lib/services/embeddings.ts).
*   Using Neon Serverless PostgreSQL with the `pgvector` extension, we run a similarity check via a raw SQL query using the cosine distance operator (`<=>`):
    ```sql
    SELECT "itemId", 1 - (embedding <=> $1::vector) AS similarity
    FROM "ItemEmbedding"
    WHERE "itemType" = $2
    ORDER BY similarity DESC LIMIT 1
    ```
*   If the maximum cosine similarity is greater than **0.85**, it is flagged as a semantic duplicate, and the database insertion is skipped.

### 3. API Resilience, Token Optimization & Free-Tier Adaptation
*   **Rate Limit Safeguards**: Operating on the Gemini API Free Tier requires adhering to a strict **15 RPM** (Requests Per Minute) rate limit. The ingestion cron route enforces a programmatic 3-second delay between sequential scraping executions to prevent `429 Too Many Requests` exceptions.
*   **High-Resiliency Chat Fallback**: The customer service assistant in [route.ts](./src/app/api/chat/route.ts) loops through fallback models (`gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-2.5-flash-lite`) and handles `503 Service Unavailable` and `429` rate-limit errors using retries with exponential backoffs.
*   **Token Compression**: The chat service optimizes prompt token sizes by mapping active database promotions into a highly compressed JSON format (remapping descriptive keys to single-character letters, e.g. `storeName` to `n`), reducing prompt payloads by over **60%** and cutting response latency.
*   **Agility & Cost Control**: Inside the DB, the system computes and logs the real estimated cost of every agent run inside the `AgentLog` table. This tracking allows administrators to monitor expenses and facilitates seamlessly swapping the underlying AI model/provider if pricing structures or corporate partnerships change.

### 4. High-Performance Client Rendering & Caching
*   **Incremental Static Regeneration (ISR)**: The homepage is cached at the edge and revalidated every 60 seconds (`revalidate = 60` in [page.tsx](./src/app/page.tsx)). This delivers rapid load times to users while shielding the serverless Postgres connection pool from direct database hits during traffic spikes.
*   **Client Caching (TTL)**: The public [ChatBox.tsx](./src/components/ai/ChatBox.tsx) stores conversation history in `localStorage` with a 12-hour Time-To-Live (TTL) cache, preserving state across page refreshes and minimizing duplicate API invocations.

### 5. Serverless Database Connection Optimization
In serverless environments, horizontal auto-scaling can lead to rapid connection exhaustion. We override Prisma's default settings in [prisma.ts](./src/lib/prisma.ts) using a custom `Pool` adapter:
*   `max: 3`: Restricts concurrent connections per serverless container.
*   `idleTimeoutMillis: 10000`: Promptly terminates idle connection channels after 10 seconds.
*   `connectionTimeoutMillis: 10000`: Aborts connections that hang due to database loads, preventing downstream system locks.

---

## 🗄️ Database Architecture

The [Prisma schema](./prisma/schema.prisma) defines the following data models:
*   **`Promotion`**: Tracks store name, start/end dates, image webp payload, specific weekdays, maps link, and status (`ESTRELLA`, `IMPORTANTE`, `NORMAL`, `ULTIMO`). Indexed by `[startDate, endDate]` to optimize date-filtering queries.
*   **`Event`**: Tracks weekend events, dates, show details, maps coordinates, and ticket CTAs.
*   **`MonitoredInstagram`**: Manages target Instagram handles to scrape.
*   **`AgentLog`**: Records token usage (prompt/completion), costs, processed counts, and error reports for administrative auditing.
*   **`ItemEmbedding`**: Stores computed vector representations (`vector(768)`) mapped to Promotions/Events for pgvector operations.

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js**: v20 or higher.
- **PostgreSQL**: Local instance or Neon Cloud database with `pgvector` extension enabled.
- **Google Generative AI Key**: Required for Gemini.
- **Apify API Token**: Required to scrape Instagram profiles.

### 💻 Local Setup Instructions

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd promojujuydef
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root folder using this template:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    GOOGLE_API_KEY="your_gemini_api_key"
    APIFY_API_TOKEN="your_apify_api_token"
    ADMIN_USERNAME="admin"
    ADMIN_PASSWORD="hashed_password_or_plain"
    NODE_ENV="development"
    ```

4.  **Database Migration**:
    Initialize Prisma and push the relational schema to PostgreSQL:
    ```bash
    npx prisma db push
    ```

5.  **Run Seed Data (Optional)**:
    Seed categories or initial test records:
    ```bash
    npm run prisma db seed  # if configured, or run custom scripts:
    node seed-admin.js
    ```

6.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to browse the portal.

---

## 📈 Next-Step Scalability Recommendations
For a global scale deployment, the next architectural milestones include:
1.  **Message Queue Ingestion**: Move ingestion from standard API CRONs to a message broker (e.g. BullMQ with Redis or QStash) to support asynchronous parallel processing, retries, and dedicated queue workers.
2.  **Vector Index Optimization**: Implement an `HNSW` or `IVFFlat` vector index on the Postgres `embedding` column once the dataset exceeds $10^5$ items to avoid linear scanning bottlenecks.
3.  **Edge Rate Limiting**: Deploy a rate-limiting middleware (e.g., Upstash Rate Limit) at the edge routing layer to safeguard the public chat assistant from resource depletion.
