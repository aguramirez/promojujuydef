import { ApifyClient } from "apify-client";

// Initialize the ApifyClient with API token from env
const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || "",
});

export interface InstagramPost {
  id: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
  postUrl: string;
}

/**
 * Fetches the latest posts from a given Instagram profile using Apify.
 * @param username The Instagram username (without @).
 * @param maxPosts Maximum number of posts to retrieve.
 */
export async function fetchLatestInstagramPosts(
  username: string,
  maxPosts: number = 5
): Promise<InstagramPost[]> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.warn("APIFY_API_TOKEN is not set in environment variables. Returning empty posts list.");
    return [];
  }

  try {
    console.log(`Starting Apify Instagram scraper for @${username}...`);
    
    // Configuration for the official apify/instagram-scraper
    const input = {
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: "posts",
      resultsLimit: maxPosts,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
      },
    };

    // Run the actor and wait for it to complete
    const run = await client.actor("apify/instagram-scraper").call(input);

    // Fetch the scraped results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    // Filter out error payloads or empty objects
    const validItems = items.filter((item: any) => !item.error && (item.id || item.shortcode));
    
    console.log(`Successfully scraped ${validItems.length} valid items from @${username} (out of ${items.length} total)`);

    return validItems.map((item: any) => {
      // Map potential fields to normalize the data structure
      const caption = item.caption || item.text || "";
      const imageUrl = item.displayUrl || item.imageUrl || (item.images && item.images[0]) || "";
      const timestamp = item.timestamp || item.takenAt || new Date().toISOString();
      const postUrl = item.url || (item.shortcode ? `https://www.instagram.com/p/${item.shortcode}/` : "");
      const id = item.id || item.shortcode || Math.random().toString(36).substring(7);

      return {
        id,
        caption,
        imageUrl,
        timestamp,
        postUrl,
      };
    });
  } catch (error) {
    console.error(`Error scraping Instagram for @${username}:`, error);
    return [];
  }
}
