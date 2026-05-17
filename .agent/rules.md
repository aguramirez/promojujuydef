# PROMO JUJUY - AI Assistant Context & Guidelines

You are the AI coding assistant for the "PROMO JUJUY" project. This document serves as your permanent context. Refer to these rules and architecture guidelines for any code generation, refactoring, or architectural decisions.

## 1. Project Overview
- **Name:** PROMO JUJUY
- **Description:** A web platform dedicated to showcasing weekly promotions, deals, and discounts from local businesses in Jujuy, Argentina.
- **Language:** **ALL user-facing text, copy, placeholders, buttons, labels, and error messages MUST BE IN SPANISH (Argentine dialect).** Code variables and comments can be in English.

## 2. Technology Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **Backend/API:** Next.js Route Handlers (`app/api/*`).
- **Database:** Neon (Serverless PostgreSQL) managed via Prisma ORM.
- **Deployment:** Vercel (Web App) & Neon (DB).
- **AI Integration:** `@google/generative-ai` (Gemini API).

## 3. Frontend Architecture & Design Rules
- **Design System:** 
  - Primary Color: `#E63333` (Used for branding, primary buttons, accents).
  - Typography: `Poppins` (via `next/font/google`).
- **Landing Page Structure:**
  - **Header:** Minimalist. CTA button pointing to Instagram `@promo.jujuy` ("¡Subí tu promo acá!" / "Publicar mi Comercio").
  - **Hero Section:** High-impact value proposition in Spanish.
  - **Weekly Calendar:** Horizontal slider for Mon-Sun. Auto-selects the current day. Clicking a day filters the promotion grid dynamically without reloading.
  - **Promotions Grid:** Responsive (`grid-cols-1 md:grid-cols-3`). Cards display: Business Name, Cover Image, Description, Date Range Badge, and a `#E63333` CTA link.
- **AI ChatBox Component (`components/ai/ChatBox.tsx`):**
  - **UI/UX:** Floating, pill-shaped input container. Glassmorphism backdrop (`bg-white/80 dark:bg-black/80 backdrop-blur-sm`).
  - **AI Glow Effect:** Animated gradient border (`ai-glow-border`) using `#4b00ad`, `#00d2ff`, and `#ff00d2`.
  - **Lead Capture & Paywall:** 
    - 1 free message allowed.
    - 2nd message onwards is blurred with a "Contenido Bloqueado" overlay.
    - Clicking overlay opens a Lead Form (Name, Email, WhatsApp).
    - Upon submission, save `hasSubmittedData: true` in `localStorage` to unlock the chat permanently.
  - **Chat Interaction:** Render Markdown. If AI responds with `[BUTTON: Text]`, render interactive Tailwind buttons below the message. Save history in `localStorage` with a 12h TTL.

## 4. Backend & Database Architecture
- **Schema (`prisma/schema.prisma`):**
  - `PromotionStatus` Enum: `ESTRELLA`, `IMPORTANTE`, `NORMAL`, `ULTIMO`.
  - `Promotion`: id, storeName, imageUrl, description, startDate, endDate, ctaUrl, status. (Index on startDate, endDate). The status determines sort order: ESTRELLA -> IMPORTANTE -> NORMAL -> ULTIMO.
  - `Lead`: id, name, email, whatsapp (unique).
- **Lead API (`app/api/leads/route.ts`):**
  - Accepts POST requests with name, email, whatsapp.
  - Automatically formats the whatsapp number to include the +549 prefix if not provided correctly.
  - Saves to database via Prisma Upsert (on email).
- **Admin Panel (`/admin`):**
  - Restricted CRUD UI to manage promotions.
- **Image Pipeline:**
  - Intercept multipart/form-data.
  - Compress and transcode to `.webp` or `.avif` at 80% quality (e.g., using `sharp`).
  - Images are stored locally in the project structure, committed to the repo. Delete original after upload, and delete optimized image when the promo expires and is removed from DB.
- **AI Chatbot API (`app/api/chat/route.ts`):**
  - **Resilience:** Fallback chain (`gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-2.5-flash-lite`). Try/catch block with exactly 2000ms delay on 503 or 429 errors before the next fallback.
  - **Safety:** Set all HarmCategory rules to `BLOCK_NONE`.
  - **Context Injection:** Query Neon DB for active promotions (valid for the current day) and inject the JSON snapshot into the system prompt. Maintain conversational history using the SDK's history mechanism.

## 5. Chatbot Persona & Prompt Rules
- **Role:** Official PROMO JUJUY virtual assistant.
- **Tone:** Friendly, enthusiastic, professional Northern Argentine Spanish.
- **Constraints:** 
  - Recommend ONLY active promotions from the provided database context.
  - Be extremely concise (mobile-first reading).
  - End responses using dynamic buttons: `[BUTTON: Text]` to guide the user.

## 6. General Development Guidelines
- Always prioritize performance and mobile-first responsiveness.
- Write clean, modular, and strongly-typed TypeScript code.
- Wait for explicit user confirmation before installing packages or writing large blocks of implementation code.
