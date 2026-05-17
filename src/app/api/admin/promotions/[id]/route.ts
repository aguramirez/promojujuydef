import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

// PATCH /api/admin/promotions/[id] — Update any field of a promotion
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Extract fields from body
  const { 
    storeName, 
    title,
    description, 
    startDate, 
    endDate, 
    ctaUrl, 
    mapsUrl, 
    status, 
    published, 
    categoryId 
  } = body;

  try {
    const promo = await prisma.promotion.update({
      where: { id },
      data: {
        ...(storeName && { storeName }),
        ...(title !== undefined && { title }),
        ...(description && { description }),
        ...(startDate && { startDate: new Date(startDate.substring(0, 10) + "T12:00:00") }),
        ...(endDate && { endDate: new Date(endDate.substring(0, 10) + "T12:00:00") }),
        ...(ctaUrl !== undefined && { ctaUrl }),
        ...(mapsUrl !== undefined && { mapsUrl }),
        ...(status && { status }),
        ...(published !== undefined && { published }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: true }
    });

    return NextResponse.json(promo);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}
