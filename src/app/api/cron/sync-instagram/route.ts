import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLatestInstagramPosts } from "@/lib/services/apify";
import { checkDuplicateAndSaveEmbedding } from "@/lib/services/embeddings";
import { appGraph } from "@/lib/agents/workflow";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  console.log("Starting Instagram synchronization cron job...");
  
  let totalScraped = 0;
  let totalPromosAdded = 0;
  let totalEventsAdded = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    // 1. Fetch monitored Instagram accounts from DB
    const profiles = await prisma.monitoredInstagram.findMany();
    if (profiles.length === 0) {
      console.log("No monitored Instagram profiles found in DB.");
      return NextResponse.json({ message: "No profiles monitored" });
    }

    // 2. Loop through each monitored account
    for (const profile of profiles) {
      console.log(`Processing Instagram profile @${profile.username} (Store: ${profile.storeName})...`);
      
      // Fetch latest 3 posts from Apify
      const posts = await fetchLatestInstagramPosts(profile.username, 3);
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
          console.log(`Post URL ${post.postUrl} already processed in DB. Skipping.`);
          continue;
        }

        // Initialize state for the LangGraph agents flow
        const inputState = {
          postId: post.id,
          captionText: post.caption,
          imageUrl: post.imageUrl,
          postUrl: post.postUrl,
          timestamp: post.timestamp,
          promptTokens: 0,
          completionTokens: 0,
          validationErrors: [],
          isValid: false,
        };

        console.log(`Invoking agent graph for post: ${post.postUrl}`);
        const resultState: any = await appGraph.invoke(inputState as any);

        // Accumulate token usage
        totalPromptTokens += resultState.promptTokens || 0;
        totalCompletionTokens += resultState.completionTokens || 0;

        // Skip if classified as NONE (informative/not commercial/not event)
        if (resultState.itemType === "NONE") {
          console.log(`Post ${post.id} classified as NONE. Discarding.`);
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
          const isDuplicate = await checkDuplicateAndSaveEmbedding(
            promoId,
            textToEmbed,
            "PROMOTION"
          );

          if (isDuplicate) {
            console.log(`Promotion '${title}' is a semantic duplicate. Skipping insertion.`);
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
              imageUrl: post.imageUrl,
              startDate: new Date(promoData.startDate || post.timestamp),
              endDate: new Date(promoData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
              ctaUrl: post.postUrl,
              categoryId,
              dias: promoData.dias || [],
              published,
            },
          });

          totalPromosAdded++;
          console.log(`Saved Promotion: '${title}' (Published: ${published})`);

        // 4. Process Event
        } else if (resultState.itemType === "EVENT" && resultState.extractedEvent) {
          const eventData = resultState.extractedEvent;
          const storeName = eventData.storeName || profile.storeName;
          const title = eventData.title || "Evento Especial";
          const description = eventData.description || post.caption;

          const textToEmbed = `${title} ${description}`;
          const eventId = randomUUID();

          // RAG check for semantic duplicates (using pgvector)
          const isDuplicate = await checkDuplicateAndSaveEmbedding(
            eventId,
            textToEmbed,
            "EVENT"
          );

          if (isDuplicate) {
            console.log(`Event '${title}' is a semantic duplicate. Skipping insertion.`);
            continue;
          }

          await prisma.event.create({
            data: {
              id: eventId,
              storeName,
              title,
              description,
              imageUrl: post.imageUrl,
              date: new Date(eventData.date || post.timestamp),
              ctaUrl: eventData.ctaUrl || post.postUrl,
              published,
            },
          });

          totalEventsAdded++;
          console.log(`Saved Event: '${title}' (Published: ${published})`);
        }
      }
    }

    // Cost estimation for Gemini 1.5 Flash
    // Input: $0.075 / 1M tokens ($0.000000075 / token)
    // Output: $0.30 / 1M tokens ($0.00000030 / token)
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

    return NextResponse.json({
      success: true,
      postsScraped: totalScraped,
      promosAdded: totalPromosAdded,
      eventsAdded: totalEventsAdded,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      estimatedCostUSD: estimatedCost,
    });

  } catch (error: any) {
    console.error("Critical error inside sync cron job:", error);
    
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

    return NextResponse.json(
      { error: "Sincronización fallida", details: error.message },
      { status: 500 }
    );
  }
}
