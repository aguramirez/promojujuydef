import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLatestInstagramPosts } from "@/lib/services/apify";
import { checkDuplicateAndSaveEmbedding } from "@/lib/services/embeddings";
import { appGraph } from "@/lib/agents/workflow";
import { randomUUID } from "crypto";
import sharp from "sharp";

async function downloadAndCompressImage(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch image directly from ${url} (status: ${res.status})`);
      return "";
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
      
    return `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error downloading or compressing image from URL:", url, error);
    return "";
  }
}

class StreamLogger {
  private controller: ReadableStreamDefaultController<any> | null = null;
  private encoder = new TextEncoder();

  constructor(controller: ReadableStreamDefaultController<any> | null) {
    this.controller = controller;
  }

  log(message: string, type: "info" | "error" | "warn" = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (this.controller) {
      const payload = JSON.stringify({ type: "log", level: type, message, timestamp: new Date().toISOString() });
      try {
        this.controller.enqueue(this.encoder.encode(payload + "\n"));
      } catch (e) {
        console.error("Error writing log to stream:", e);
      }
    }
  }

  sendSuccess(data: any) {
    if (this.controller) {
      const payload = JSON.stringify({ type: "success", data });
      try {
        this.controller.enqueue(this.encoder.encode(payload + "\n"));
      } catch (e) {
        console.error("Error writing success to stream:", e);
      }
    }
  }

  sendError(error: string, details?: string) {
    if (this.controller) {
      const payload = JSON.stringify({ type: "error", error, details });
      try {
        this.controller.enqueue(this.encoder.encode(payload + "\n"));
      } catch (e) {
        console.error("Error writing error to stream:", e);
      }
    }
  }
}

interface SyncStats {
  postsScraped: number;
  promosAdded: number;
  eventsAdded: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUSD: number;
}

async function performSync(logger: StreamLogger): Promise<SyncStats> {
  let totalScraped = 0;
  let totalPromosAdded = 0;
  let totalEventsAdded = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    // 1. Fetch monitored Instagram accounts from DB
    const profiles = await prisma.monitoredInstagram.findMany();
    if (profiles.length === 0) {
      logger.log("No monitored Instagram profiles found in DB.", "warn");
      return {
        postsScraped: 0,
        promosAdded: 0,
        eventsAdded: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUSD: 0
      };
    }

    logger.log(`Found ${profiles.length} profiles to synchronize.`);

    // 2. Loop through each monitored account
    for (const profile of profiles) {
      logger.log(`Processing Instagram profile @${profile.username} (Store: ${profile.storeName})...`);
      
      // Fetch latest 3 posts from Apify
      logger.log(`Starting Apify Instagram scraper for @${profile.username}...`);
      const posts = await fetchLatestInstagramPosts(profile.username, 3);
      logger.log(`Successfully scraped ${posts.length} posts from @${profile.username}`);
      totalScraped += posts.length;

      for (const post of posts) {
        // Quick exact-link check to avoid running agents on already-processed posts
        const existingPromo = await prisma.promotion.findFirst({
          where: { ctaUrl: post.postUrl },
        });
        const existingEvent = await prisma.event.findFirst({
          where: { ctaUrl: post.postUrl },
        });

        if (existingPromo || existingEvent) {
          logger.log(`Post URL ${post.postUrl} already processed in DB. Skipping.`, "info");
          continue;
        }

        // Sleep de 3 segundos para respetar el límite de cuota (15 RPM del tier gratuito)
        logger.log("Waiting 3 seconds to avoid rate limits...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Usar la foto de perfil de Instagram como fallback si el post no tiene imagen (ej: reels o videos)
        const finalImageUrl = post.imageUrl || post.profilePicUrl || "";

        let storedImageUrl = finalImageUrl;
        if (finalImageUrl) {
          logger.log(`Downloading and compressing image for post: ${post.postUrl}`);
          const base64Image = await downloadAndCompressImage(finalImageUrl);
          if (base64Image) {
            storedImageUrl = base64Image;
            logger.log("Image successfully compressed to WebP");
          }
        }

        // Initialize state for the LangGraph agents flow
        const inputState = {
          postId: post.id,
          captionText: post.caption,
          imageUrl: finalImageUrl,
          postUrl: post.postUrl,
          timestamp: post.timestamp,
          promptTokens: 0,
          completionTokens: 0,
          validationErrors: [],
          isValid: false,
        };

        logger.log(`Invoking AI agent graph for post: ${post.postUrl}`);
        const resultState: any = await appGraph.invoke(inputState as any);

        // Accumulate token usage
        totalPromptTokens += resultState.promptTokens || 0;
        totalCompletionTokens += resultState.completionTokens || 0;

        // Skip if classified as NONE (informative/not commercial/not event)
        if (resultState.itemType === "NONE") {
          logger.log(`Post ${post.id} classified as NONE. Discarding.`, "info");
          continue;
        }

        // Descartar por completo (no guardar ni como borrador) si el evento ya ocurrió o la promo ya finalizó
        const isExpired = (resultState.validationErrors || []).some(
          (err: string) => err.includes("ya ha ocurrido") || err.includes("ya ha finalizado")
        );
        if (isExpired) {
          logger.log(`Post classified as ${resultState.itemType} but is already expired. Discarding completely.`, "warn");
          continue;
        }

        const published = resultState.isValid;

        // 3. Process Promotion
        if (resultState.itemType === "PROMOTION" && resultState.extractedPromo) {
          const promoData = resultState.extractedPromo;
          const storeName = promoData.storeName || profile.storeName;
          const title = promoData.title || "Promoción Especial";
          const description = promoData.description || post.caption;

          const textToEmbed = `${title} ${description}`;
          const promoId = randomUUID();

          // RAG check for semantic duplicates (using pgvector)
          logger.log(`Checking semantic duplicates for Promotion: '${title}'`);
          const isDuplicate = await checkDuplicateAndSaveEmbedding(
            promoId,
            textToEmbed,
            "PROMOTION"
          );

          if (isDuplicate) {
            logger.log(`Promotion '${title}' is a semantic duplicate. Skipping insertion.`, "warn");
            continue;
          }

          // Link category semantically if possible
          let categoryId = null;
          if (promoData.categoryId) {
            const cat = await prisma.category.findFirst({
              where: { name: { contains: promoData.categoryId, mode: "insensitive" } },
            });
            if (cat) categoryId = cat.id;
          }

          await prisma.promotion.create({
            data: {
              id: promoId,
              storeName,
              title,
              description,
              imageUrl: storedImageUrl,
              startDate: new Date(promoData.startDate || post.timestamp),
              endDate: new Date(promoData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
              ctaUrl: promoData.ctaUrl || post.postUrl,
              instagramPostUrl: post.postUrl,
              categoryId,
              dias: promoData.dias || [],
              published,
            },
          });

          totalPromosAdded++;
          logger.log(`Saved Promotion: '${title}' (Published: ${published})`, "info");

        // 4. Process Event
        } else if (resultState.itemType === "EVENT" && resultState.extractedEvent) {
          const eventData = resultState.extractedEvent;
          const storeName = eventData.storeName || profile.storeName;
          const title = eventData.title || "Evento Especial";
          const description = eventData.description || post.caption;

          const textToEmbed = `${title} ${description}`;
          const eventId = randomUUID();

          // RAG check for semantic duplicates (using pgvector)
          logger.log(`Checking semantic duplicates for Event: '${title}'`);
          const isDuplicate = await checkDuplicateAndSaveEmbedding(
            eventId,
            textToEmbed,
            "EVENT"
          );

          if (isDuplicate) {
            logger.log(`Event '${title}' is a semantic duplicate. Skipping insertion.`, "warn");
            continue;
          }

          await prisma.event.create({
            data: {
              id: eventId,
              storeName,
              title,
              description,
              imageUrl: storedImageUrl,
              date: new Date(eventData.date || post.timestamp),
              ctaUrl: eventData.ctaUrl || post.postUrl,
              instagramPostUrl: post.postUrl,
              published,
            },
          });

          totalEventsAdded++;
          logger.log(`Saved Event: '${title}' (Published: ${published})`, "info");
        }
      }
    }

    // Cost estimation for Gemini
    const estimatedCost = (totalPromptTokens * 0.000000075) + (totalCompletionTokens * 0.00000030);

    // Write execution log in Database
    await prisma.agentLog.create({
      data: {
        jobName: "IG_CRON_SYNC",
        postsScraped: totalScraped,
        promosAdded: totalPromosAdded,
        eventsAdded: totalEventsAdded,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        estimatedCost,
        status: "SUCCESS",
      },
    });

    logger.log("Synchronization process completed successfully.");
    return {
      postsScraped: totalScraped,
      promosAdded: totalPromosAdded,
      eventsAdded: totalEventsAdded,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      estimatedCostUSD: estimatedCost,
    };

  } catch (error: any) {
    logger.log(`Critical error inside sync cron job: ${error.message || String(error)}`, "error");
    
    // Log failure to AgentLog
    await prisma.agentLog.create({
      data: {
        jobName: "IG_CRON_SYNC",
        postsScraped: totalScraped,
        promosAdded: totalPromosAdded,
        eventsAdded: totalEventsAdded,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        estimatedCost: 0,
        status: "FAILED",
        error: error.message || String(error),
      },
    });

    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamMode = searchParams.get("stream") === "true";

  if (streamMode) {
    const stream = new ReadableStream({
      async start(controller) {
        const logger = new StreamLogger(controller);
        logger.log("Starting Instagram synchronization cron job in stream mode...");
        try {
          const stats = await performSync(logger);
          logger.sendSuccess(stats);
        } catch (error: any) {
          logger.sendError("Sincronización fallida", error.message || String(error));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } else {
    const logger = new StreamLogger(null);
    logger.log("Starting Instagram synchronization cron job in background mode...");
    try {
      const stats = await performSync(logger);
      return NextResponse.json({
        success: true,
        ...stats
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: "Sincronización fallida", details: error.message },
        { status: 500 }
      );
    }
  }
}
