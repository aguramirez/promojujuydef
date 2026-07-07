import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { cookies } from "next/headers";

// Auth check helper
async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const storeName = formData.get("storeName") as string;
    const title = (formData.get("title") as string) || null;
    const description = formData.get("description") as string;
    const date = new Date((formData.get("date") as string) + "T12:00:00");
    const ctaUrl = (formData.get("ctaUrl") as string) || "";
    const mapsUrl = (formData.get("mapsUrl") as string) || null;
    const image = formData.get("image") as File;

    if (!storeName || !description || !date) {
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

    const event = await prisma.event.create({
      data: {
        storeName,
        title: title || null,
        description,
        date,
        ctaUrl: ctaUrl || "#",
        mapsUrl: mapsUrl || null,
        imageUrl,
        published: true, // Admin-created events are published immediately
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
