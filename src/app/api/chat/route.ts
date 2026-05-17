import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. Fetch all published promotions
    // We fetch all published ones so the IA can also talk about upcoming promos
    const allPromotions = await prisma.promotion.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: { status: 'asc' }
    });

    // 2. Format data concisely for tokens
    const nowArg = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const todayStr = nowArg.toISOString().split('T')[0];

    const compactPromos = allPromotions.map(p => ({
      n: p.storeName,
      d: p.description,
      s: p.startDate.toISOString().split('T')[0],
      e: p.endDate.toISOString().split('T')[0],
      c: p.category?.name || "Gral",
      m: p.mapsUrl ? "📍" : ""
    }));

    // 3. Prepare System Prompt (Optimized for tokens)
    const systemPrompt = `Eres el asistente de PROMO JUJUY. 
Reglas:
- Habla en español jujeño/norteño amigable y conciso.
- Hoy es ${todayStr} (Argentina).
- Usa SOLO este JSON de promos: ${JSON.stringify(compactPromos)}
- Si una promo no empezó o terminó, mencionalo.
- No inventes datos. Respuestas de máximo 2-3 oraciones.
- Al final, podés usar: [BUTTON: Texto del Botón].

Ejemplo: "¡Hola! Hoy tenés 2x1 en Pizzas en 'La Veneciana' 🍕. [BUTTON: Ver más comida]"`;

    // 3. Fallback Model Loop
    let lastError = null;
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });

        const chat = model.startChat({
          history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text });
      } catch (error: any) {
        lastError = error;
        // If 503 or 429, wait 2s and try next model
        if (error.status === 503 || error.status === 429) {
          await delay(2000);
          continue;
        }
        // If it's a model not found or other terminal error, we might still want to try fallback
        console.error(`Error with model ${modelName}:`, error);
        continue;
      }
    }

    throw lastError || new Error("All models failed");

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Lo siento, hubo un error al procesar tu mensaje." }, { status: 500 });
  }
}
