import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Initialize Gemini Embeddings service using native SDK to support dimensionality configuration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

/**
 * Generates vector embeddings for a given string of text.
 * @param text The input text to embed.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: 768,
    } as any);
    return res.embedding.values;
  } catch (error) {
    console.error("Error generating embedding from Gemini:", error);
    throw error;
  }
}

/**
 * Checks if a post is a semantic duplicate of an existing promotion or event.
 * If it is NOT a duplicate, it saves the embedding and returns false.
 * If it is a duplicate, it returns true.
 * @param itemId The database ID of the Promotion or Event.
 * @param text The text context (title + description) of the promotion/event.
 * @param type The type of item: "PROMOTION" | "EVENT".
 */
export async function checkDuplicateAndSaveEmbedding(
  itemId: string,
  text: string,
  type: "PROMOTION" | "EVENT"
): Promise<boolean> {
  try {
    const vector = await getEmbedding(text);
    const vectorString = `[${vector.join(",")}]`;

    // Query Neon PostgreSQL to find the most similar item of the same type.
    // Uses pgvector's cosine distance operator (<=>).
    // Cosine Similarity = 1 - Cosine Distance.
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT "itemId", 1 - (embedding <=> $1::vector) AS similarity
      FROM "ItemEmbedding"
      WHERE "itemType" = $2
      ORDER BY similarity DESC
      LIMIT 1
    `, vectorString, type);

    if (result && result.length > 0) {
      const match = result[0];
      const similarity = parseFloat(match.similarity);
      console.log(`RAG duplication check: High similarity match = ${similarity} for item ${match.itemId}`);
      
      // Threshold 0.85 indicates semantic duplication
      if (similarity > 0.85) {
        return true;
      }
    }

    // Save the new unique item's embedding to DB.
    // We cast the string formatted vector to Postgres vector.
    const id = randomUUID();
    await prisma.$queryRawUnsafe(`
      INSERT INTO "ItemEmbedding" (id, "itemId", "itemType", embedding, "createdAt")
      VALUES ($1, $2, $3, $4::vector, $5)
    `, id, itemId, type, vectorString, new Date());

    return false;
  } catch (error) {
    console.error("Error in checkDuplicateAndSaveEmbedding:", error);
    // If the database query fails (e.g. pgvector not yet loaded), we fail-safe by returning false (not duplicate).
    return false;
  }
}
