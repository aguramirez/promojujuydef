import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

// PATCH /api/admin/events/[id] — Update any field of an event
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Extract fields from body
  const { 
    storeName, 
    title,
    description, 
    date, 
    ctaUrl, 
    mapsUrl, 
    published 
  } = body;

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(storeName && { storeName }),
        ...(title !== undefined && { title }),
        ...(description && { description }),
        ...(date && { date: new Date(date.substring(0, 10) + "T12:00:00") }),
        ...(ctaUrl !== undefined && { ctaUrl }),
        ...(mapsUrl !== undefined && { mapsUrl }),
        ...(published !== undefined && { published }),
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 });
  }
}
