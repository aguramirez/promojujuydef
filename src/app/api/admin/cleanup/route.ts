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
      // 1. Delete compressed image (only if it is a local file path, not a base64 string)
      if (promo.imageUrl && !promo.imageUrl.startsWith("data:")) {
        const compressedPath = path.join(process.cwd(), "public", promo.imageUrl);
        
        try {
          await unlink(compressedPath);
        } catch (e) {
          console.error("Could not delete compressed image", compressedPath);
        }
      }
      
      await prisma.promotion.delete({ where: { id: promo.id } });
    }

    return NextResponse.json({ success: true, deletedCount: expiredPromos.length });
  } catch (error) {
    return NextResponse.json({ error: "Error during cleanup" }, { status: 500 });
  }
}
