import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { cookies } from "next/headers";

// Auth check helper
async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return NextResponse.json(promotions);
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const storeName = formData.get("storeName") as string;
    const title = (formData.get("title") as string) || null;
    const description = formData.get("description") as string;
    const startDate = new Date((formData.get("startDate") as string) + "T12:00:00");
    const endDate = new Date((formData.get("endDate") as string) + "T12:00:00");
    const ctaUrl = formData.get("ctaUrl") as string;
    const mapsUrl = (formData.get("mapsUrl") as string) || null;
    const status = formData.get("status") as any;
    const categoryId = (formData.get("categoryId") as string) || null;
    const image = formData.get("image") as File;

    if (!image) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());

    // Compress and resize with sharp in-memory to ensure it remains small
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const imageUrl = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;

    const promotion = await prisma.promotion.create({
      data: {
        storeName,
        title: title || null,
        description,
        startDate,
        endDate,
        ctaUrl,
        mapsUrl: mapsUrl || null,
        status,
        published: true, // Admin-created promotions are published immediately
        imageUrl,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al crear promoción" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.promotion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
