Backoffice / CRUD UI Component
Provide a clean, restricted admin panel route (/admin) to manage promotions.

Form inputs: Business Name, File Input for Image, Description text area, Date Range picker (Start Date and End Date), and CTA Destination URL.


---

### 2. Backend & Database Rules (`rules.md`)

```markdown
# Backend Architecture Rules: PROMO JUJUY (Next.js, Prisma, Neon PostgreSQL)

Act as a Senior Fullstack Architect. Configure the backend rules, database management models, and API endpoints for the "PROMO JUJUY" web application. The production database is hosted on Neon (Serverless PostgreSQL), deployed via Vercel, using Prisma ORM.

---

## 1. Database Schema (`prisma/schema.prisma`)

Define a robust, relational schema optimized for high read volumes.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Promotion {
  id          String   @id @default(uuid())
  storeName   String
  imageUrl    String
  description String   @db.Text
  startDate   DateTime
  endDate     DateTime
  ctaUrl      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([startDate, endDate])
}

model Lead {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  whatsapp  String
  createdAt DateTime @default(now())
}
2. Image Optimization & Upload Pipeline
When an administrator creates or updates a promotion via the CRUD API endpoint:

Interception: Catch the multipart/form-data upload stream on the server.

Transcoding Pipeline: Use an image processing utility (e.g., sharp or a serverless compatible native buffer tool) to intercept the incoming image asset.

Compression & Format: Automatically transcode the file into either .webp or .avif format. Compress the quality to a balanced 80% to ensure lightning-fast mobile loading speeds.

Storage: store the absolute URL in the imageUrl column of the Promotion table, i want to store the images in this project structure in a folder a submit it to the github repository, and delete the original image after upload it to the server and when the promotion is deleted from the database, delete the image from the folder, the promotion will be deleted after its end date.

3. Multi-Model AI Chatbot Endpoint (app/api/chat/route.ts)
Core Architecture
SDK: @google/generative-ai

Fallback Chain: Execute a resilient fallback array chain: gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite.

Resilience Engine: Wrap calls inside a try/catch loop structure. If the API yields a 503 (Service Unavailable) or a 429 (Rate Limit Exceeded), trigger an asynchronous delay of exactly 2000ms (2 seconds) before retrying with the next fallback model down the chain.

Context Preservation: Accept an incoming history array along with the current message string. Initialize model.startChat({ history }) to retain ongoing conversational state.

Safety Overrides: Set all HarmCategory rules explicitly to BLOCK_NONE to prevent false-positive content blocks on local colloquial store names or phrases.

Real-Time Promotion Context Injection
Before sending the history payload to the Gemini SDK, the endpoint must query the Neon Database to fetch all promotions valid for the current date. Inject this dynamic database snapshot into the SYSTEM_PROMPT.