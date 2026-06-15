import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const storeName = formData.get("storeName") as string;
    const title = (formData.get("title") as string) || null;
    const description = formData.get("description") as string;
    const date = new Date((formData.get("date") as string) + "T12:00:00");
    const ctaUrl = (formData.get("ctaUrl") as string) || "";
    const mapsUrl = (formData.get("mapsUrl") as string) || null;
    const image = formData.get("image") as File;

    if (!storeName || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    let imageUrl = "";
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

      imageUrl = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
    }

    const event = await prisma.event.create({
      data: {
        storeName,
        title: title || null,
        description,
        date,
        ctaUrl: ctaUrl || "#",
        mapsUrl: mapsUrl || null,
        imageUrl,
        published: false,
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error("Event submit error:", error);
    return NextResponse.json({ error: "Error al guardar el evento" }, { status: 500 });
  }
}
