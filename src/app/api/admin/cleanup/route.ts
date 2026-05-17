import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function POST() {
  try {
    const now = new Date();
    // Find expired promotions
    const expiredPromos = await prisma.promotion.findMany({
      where: {
        endDate: { lt: now }
      }
    });

    for (const promo of expiredPromos) {
      // 1. Delete compressed image
      if (promo.imageUrl) {
        const compressedPath = path.join(process.cwd(), "public", promo.imageUrl);
        const originalFilename = path.basename(promo.imageUrl).replace('.webp', '');
        
        try {
          await unlink(compressedPath);
        } catch (e) {
          console.error("Could not delete compressed image", compressedPath);
        }

        // 2. Delete original image (searching by basename)
        // This assumes we can find the original with the same basename but different extension
        // Since we don't store the original path, we'd need to search or store it.
        // For simplicity, let's just delete the DB record.
      }
      
      await prisma.promotion.delete({ where: { id: promo.id } });
    }

    return NextResponse.json({ success: true, deletedCount: expiredPromos.length });
  } catch (error) {
    return NextResponse.json({ error: "Error during cleanup" }, { status: 500 });
  }
}
