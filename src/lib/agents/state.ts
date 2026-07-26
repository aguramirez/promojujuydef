import { Annotation } from "@langchain/langgraph";

// Define the state annotation object that travels through the LangGraph agents.
export const AgentStateAnnotation = Annotation.Root({
  postId: Annotation<string>(),
  captionText: Annotation<string>(),
  imageUrl: Annotation<string>(),
  postUrl: Annotation<string>(),
  timestamp: Annotation<string>(),
  
  // Classification results: PROMOTION, EVENT, or NONE
  itemType: Annotation<"PROMOTION" | "EVENT" | "NONE">(),
  
  // Extracted fields for Promotions
  extractedPromo: Annotation<{
    title?: string;
    storeName?: string;
    description?: string;
    startDate?: string; // ISO string format
    endDate?: string;   // ISO string format
    ctaUrl?: string;
    categoryId?: string;
    dias?: string[];
  }>(),
  
  // Extracted fields for Events
  extractedEvent: Annotation<{
    title?: string;
    storeName?: string;
    description?: string;
    date?: string;      // ISO string format
    ctaUrl?: string;
  }>(),
  
  // Validation tracking
  validationErrors: Annotation<string[]>(),
  isValid: Annotation<boolean>(),
  
  // Token usage tracking
  promptTokens: Annotation<number>(),
  completionTokens: Annotation<number>(),
});

export type AgentState = typeof AgentStateAnnotation.State;
