import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

// PATCH /api/admin/promotions/[id]/approve — toggle published status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { published } = await req.json();

  const promo = await prisma.promotion.update({
    where: { id },
    data: { published },
  });

  return NextResponse.json(promo);
}
