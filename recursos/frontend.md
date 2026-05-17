# Prompt: PROMO JUJUY Frontend Implementation (Next.js, Tailwind CSS, TypeScript)

Act as a Senior Frontend Engineer. Build a high-converting, modern, and high-performance landing page and dashboard client for "PROMO JUJUY", a platform dedicated to showcasing weekly promotions from local businesses in Jujuy, Argentina.

## Critical Design & Copy Requirements
- **Primary Color:** `#E63333` (Use it for main branding, primary buttons, accents, and highlights).
- **Typography:** `Poppins` (Ensure it is imported via `next/font/google` or standard CSS).
- **Language:** **ALL user-facing text, copy, placeholders, buttons, labels, and error messages MUST BE IN SPANISH**. 
- **Framework:** Next.js (App Router), React, Tailwind CSS, TypeScript.

---

## 1. Landing Page Main Structure

### Header & Brand Call-to-Action
- Clean, minimalist navbar with the brand name **PROMO JUJUY**.
- A prominent, attractive sticky or floating CTA button pointing to Instagram: `@promo.jujuy`.
- **Text for CTA:** "¡Subí tu promo acá!" or "Publicar mi Comercio". When clicked, it opens `https://instagram.com/promo.jujuy` in a new tab.

### Hero Section
- High-impact headline in Spanish explaining the value proposition: Free advertising for local businesses, and the best weekly deals for citizens.

### Dynamic Weekly Calendar Component (Core Feature)
- A horizontal slider or button row showing the days of the current week (Monday to Sunday) with their respective calendar dates (e.g., "Lun 18", "Mar 19").
- **Auto-Selection:** On initial load, the system must automatically detect the current real-world day and highlight it as active using the primary color `#E63333`.
- **Interactivity:** Clicking on any day must instantly filter and update the displayed grid of promotions for that specific day without a full page reload.

### Promotions Grid & Card Component
- A responsive grid (`grid-cols-1 md:grid-cols-3 gap-6`) showing the active promotions.
- Each promo card must render:
  - Business Name.
  - Optimized Cover Image.
  - Clear Description text.
  - Active Date Range Badge (e.g., "Válido: 15/05 al 20/05").
  - **CTA Button:** A highly visible button using `#E63333` that links to the business's custom destination (Instagram, Web, or WhatsApp).

---

## 2. Premium AI ChatBox Component (`components/ai/ChatBox.tsx`)

Implement a floating, premium conversational UI at the bottom-center of the screen.

### "AI Glow" Visual Style
- **Shape:** Symmetrical pill-shaped input container (`rounded-full` or `rounded-2xl`).
- **Animated Border (`ai-glow-border`):** Apply an animated gradient border using a continuous rotation of Gemini colors: `#4b00ad`, `#00d2ff`, and `#ff00d2`.
- **Backdrop:** Glassmorphism overlay (`bg-white/80 dark:bg-black/80 backdrop-blur-sm`).

### Paywall & Lead Capture Logic
- **Free Limit:** The user can send **1 message** and receive a full response.
- **Lock Effect:** From the **second message onwards**, the chat response from the API must be obscured using a blur effect (`blur-sm`) overlaid with a "Contenido Bloqueado" (Locked Content) glass card.
- **Lead Capture Modal:** Clicking the locked overlay opens a modern Modal requesting:
  - Nombre (Name)
  - Email
  - WhatsApp
- **Persistence:** Submitting this form saves `hasSubmittedData: true` into `localStorage`. Once true, the chat is unlocked permanently.

### Message Rendering & Interactive UI
- **Markdown Support:** Render bold, italics, and lists correctly.
- **Dynamic Action Buttons:** If the AI response contains the pattern `[BUTTON: Text]`, extract it and render custom interactive Tailwind buttons below the message box. Clicking these buttons must immediately submit the text as a new user message.
- **State:** Cache chat history in `localStorage` with a Time-To-Live (TTL) of 12 hours.

---

## 3. Global CSS Configurations (`app/globals.css`)
Incorporate the following CSS animations to achieve the Gemini AI signature glow:

```css
@keyframes ai-gradient-wave {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.ai-glow-border {
  position: relative;
  padding: 2px;
  border-radius: 1rem;
  overflow: hidden;
}

.ai-glow-border::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #4b00ad, #00d2ff, #ff00d2, #00d2ff, #4b00ad);
  background-size: 300% 100%;
  animation: ai-gradient-wave 5s ease-in-out infinite;
}