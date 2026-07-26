import { StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { AgentStateAnnotation, AgentState } from "./state";

// Initialize Gemini model via LangChain
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
  model: "gemini-2.5-flash",
  temperature: 0.1,
});

/**
 * Downloads an image from a URL and converts it to base64 for multimodal LLM processing.
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  } catch (e) {
    console.error("Error fetching image for agent OCR:", e);
    return null;
  }
}

// ----------------------------------------------------
// 1. CLASSIFIER NODE (Promotion vs Event vs None)
// ----------------------------------------------------
const classificationSchema = z.object({
  itemType: z
    .enum(["PROMOTION", "EVENT", "NONE"])
    .describe(
      "Categoriza el post: PROMOTION si es una oferta comercial, descuento, combo o promoción. EVENT si es un show, concierto, fiesta o evento con fecha. NONE si es un post cotidiano o informativo sin ofertas."
    ),
});

async function classifyNode(state: AgentState) {
  try {
    const base64Image = await fetchImageAsBase64(state.imageUrl);
    const content: any[] = [
      {
        type: "text",
        text: `Analiza esta publicación de Instagram. Determina si es una Promoción comercial (descuento, 2x1, combo), un Evento (fiesta, recital, show con fecha y hora) o Ninguna de las anteriores (post informativo, foto cotidiana, etc.).
        
        Texto de la publicación:
        "${state.captionText}"`
      }
    ];

    if (base64Image) {
      content.push({
        type: "image_url",
        image_url: `data:image/jpeg;base64,${base64Image}`
      });
    }

    const structuredModel = model.withStructuredOutput(classificationSchema, { includeRaw: true });
    const response = await structuredModel.invoke([new HumanMessage({ content })]);
    
    const parsed = response.parsed;
    const raw = response.raw;
    const usage = (raw as any).response_metadata?.tokenUsage || { promptTokens: 0, completionTokens: 0 };

    return {
      itemType: parsed.itemType,
      promptTokens: (state.promptTokens || 0) + (usage.promptTokens || 0),
      completionTokens: (state.completionTokens || 0) + (usage.completionTokens || 0),
    };
  } catch (error) {
    console.error("Error in classifyNode:", error);
    return { itemType: "NONE" as const };
  }
}

// ----------------------------------------------------
// 2. EXTRACTION NODE (Zod Structured Outputs)
// ----------------------------------------------------
const promotionExtractionSchema = z.object({
  title: z.string().describe("Título atractivo y corto de la promoción (ej. '2x1 en Pintas', 'Menú del Día', '15% OFF')"),
  storeName: z.string().describe("Nombre del comercio o negocio (ej. 'Gomez Burger', 'El Noble')"),
  description: z.string().describe("Descripción detallada de la oferta, precios, condiciones o productos incluidos."),
  startDate: z.string().describe("Fecha de inicio de la promoción en formato YYYY-MM-DD. Si no se especifica, usa la fecha del post original."),
  endDate: z.string().describe("Fecha de finalización en formato YYYY-MM-DD. Si no se especifica, estima una fecha razonable (ej. 7 días después de la fecha del post)."),
  dias: z.array(z.string()).describe("Días de la semana en los que aplica (ej. ['Lunes', 'Martes', 'Miércoles'])"),
  categoryId: z.string().optional().describe("ID de categoría o nombre sugerido si no se conoce (ej. 'Gastronomía', 'Indumentaria')"),
});

const eventExtractionSchema = z.object({
  title: z.string().describe("Nombre del evento (ej. 'Stand Up de Lucas', 'Fiesta Sunset')"),
  storeName: z.string().describe("Nombre del lugar o local donde se realiza el evento"),
  description: z.string().describe("Detalles completos del evento (artistas, precios, condiciones, etc.)"),
  date: z.string().describe("Fecha y hora del evento en formato YYYY-MM-DDTHH:mm. Si no se especifica hora, usa YYYY-MM-DD"),
  ctaUrl: z.string().optional().describe("URL para comprar entradas si se indica en el texto o imagen (ej. Passline, etc.)"),
});

async function extractNode(state: AgentState) {
  try {
    const base64Image = await fetchImageAsBase64(state.imageUrl);
    const content: any[] = [
      {
        type: "text",
        text: `Extrae la información estructurada de este post de Instagram que fue clasificado como ${state.itemType}.
        Fecha del post original: ${state.timestamp}
        Texto:
        "${state.captionText}"`
      }
    ];

    if (base64Image) {
      content.push({
        type: "image_url",
        image_url: `data:image/jpeg;base64,${base64Image}`
      });
    }

    if (state.itemType === "PROMOTION") {
      const structuredModel = model.withStructuredOutput(promotionExtractionSchema, { includeRaw: true });
      const response = await structuredModel.invoke([new HumanMessage({ content })]);
      
      const parsed = response.parsed;
      const raw = response.raw;
      const usage = (raw as any).response_metadata?.tokenUsage || { promptTokens: 0, completionTokens: 0 };
      
      return {
        extractedPromo: parsed,
        promptTokens: (state.promptTokens || 0) + (usage.promptTokens || 0),
        completionTokens: (state.completionTokens || 0) + (usage.completionTokens || 0),
      };
    } else if (state.itemType === "EVENT") {
      const structuredModel = model.withStructuredOutput(eventExtractionSchema, { includeRaw: true });
      const response = await structuredModel.invoke([new HumanMessage({ content })]);
      
      const parsed = response.parsed;
      const raw = response.raw;
      const usage = (raw as any).response_metadata?.tokenUsage || { promptTokens: 0, completionTokens: 0 };
      
      return {
        extractedEvent: parsed,
        promptTokens: (state.promptTokens || 0) + (usage.promptTokens || 0),
        completionTokens: (state.completionTokens || 0) + (usage.completionTokens || 0),
      };
    }

    return {};
  } catch (error) {
    console.error("Error in extractNode:", error);
    return {};
  }
}

// ----------------------------------------------------
// 3. VALIDATOR NODE
// ----------------------------------------------------
async function validateNode(state: AgentState) {
  const errors: string[] = [];
  let isValid = true;

  if (state.itemType === "PROMOTION") {
    const promo = state.extractedPromo;
    if (!promo) {
      errors.push("No se pudo extraer ninguna información de la promoción.");
      isValid = false;
    } else {
      if (!promo.storeName || promo.storeName.trim() === "") {
        errors.push("Falta el nombre del comercio (storeName).");
        isValid = false;
      }
      if (!promo.title || promo.title.trim() === "") {
        errors.push("Falta el título de la promoción.");
        isValid = false;
      }
      if (!promo.description || promo.description.trim() === "") {
        errors.push("Falta la descripción de la promoción.");
        isValid = false;
      }
      if (!promo.startDate) {
        errors.push("Falta la fecha de inicio.");
        isValid = false;
      }
      if (!promo.endDate) {
        errors.push("Falta la fecha de finalización.");
        isValid = false;
      }
      if (promo.startDate && promo.endDate) {
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        if (end < start) {
          errors.push("La fecha de finalización no puede ser anterior a la fecha de inicio.");
          isValid = false;
        }
        
        // Validar si la promoción ya expiró en relación a hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (end < today) {
          errors.push("La promoción ya ha finalizado.");
          isValid = false;
        }
      }
    }
  } else if (state.itemType === "EVENT") {
    const event = state.extractedEvent;
    if (!event) {
      errors.push("No se pudo extraer ninguna información del evento.");
      isValid = false;
    } else {
      if (!event.storeName || event.storeName.trim() === "") {
        errors.push("Falta el nombre del lugar donde se realiza (storeName).");
        isValid = false;
      }
      if (!event.title || event.title.trim() === "") {
        errors.push("Falta el título del evento.");
        isValid = false;
      }
      if (!event.description || event.description.trim() === "") {
        errors.push("Falta la descripción del evento.");
        isValid = false;
      }
      if (!event.date) {
        errors.push("Falta la fecha del evento.");
        isValid = false;
      } else {
        // Validar si el evento ya ocurrió
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          errors.push("El evento ya ha ocurrido.");
          isValid = false;
        }
      }
    }
  } else {
    isValid = false;
    errors.push("La publicación no fue clasificada como promoción ni como evento.");
  }

  return {
    isValid,
    validationErrors: errors,
  };
}

// ----------------------------------------------------
// 4. GRAPH ASSEMBLY
// ----------------------------------------------------
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("classify", classifyNode)
  .addNode("extract", extractNode)
  .addNode("validate", validateNode)
  
  .addEdge("__start__", "classify")
  
  .addConditionalEdges("classify", (state) => {
    if (state.itemType === "NONE") {
      return "__end__";
    }
    return "extract";
  }, {
    extract: "extract",
    __end__: "__end__"
  })
  
  .addEdge("extract", "validate")
  .addEdge("validate", "__end__");

export const appGraph = workflow.compile();
export type AppGraphType = typeof appGraph;
