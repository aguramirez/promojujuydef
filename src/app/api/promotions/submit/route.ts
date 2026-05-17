import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Public endpoint: submit a promotion for approval (published = false by default)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const storeName = formData.get("storeName") as string;
    const title = (formData.get("title") as string) || null;
    const description = formData.get("description") as string;
    const startDate = new Date((formData.get("startDate") as string) + "T12:00:00");
    const endDate = new Date((formData.get("endDate") as string) + "T12:00:00");
    const ctaUrl = (formData.get("ctaUrl") as string) || "";
    const mapsUrl = (formData.get("mapsUrl") as string) || null;
    const categoryId = (formData.get("categoryId") as string) || null;
    const image = formData.get("image") as File;

    if (!storeName || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    let imageUrl = "";
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      
      // Compress and resize with sharp in-memory to ensure it remains small
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

      imageUrl = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
    }

    const promotion = await prisma.promotion.create({
      data: {
        storeName,
        title: title || null,
        description,
        startDate,
        endDate,
        ctaUrl: ctaUrl || "#",
        mapsUrl: mapsUrl || null,
        imageUrl,
        published: false, // always starts unpublished
        categoryId: categoryId || null,
      },
    });

    return NextResponse.json({ success: true, id: promotion.id });
  } catch (error) {
    console.error("Public submit error:", error);
    return NextResponse.json({ error: "Error al guardar la promoción" }, { status: 500 });
  }
}
