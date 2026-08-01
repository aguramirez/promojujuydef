import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Get all monitored Instagram profiles or execution logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchLogs = searchParams.get("logs") === "true";

    if (fetchLogs) {
      const logs = await prisma.agentLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      });
      return NextResponse.json(logs);
    }

    const profiles = await prisma.monitoredInstagram.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("Error fetching Instagram data:", error);
    return NextResponse.json(
      { error: "Error al obtener la información de Instagram." },
      { status: 500 }
    );
  }
}

// POST: Add a new monitored Instagram profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { username, storeName } = body;

    if (!username || !storeName) {
      return NextResponse.json(
        { error: "El usuario de Instagram y el nombre del negocio son obligatorios." },
        { status: 400 }
      );
    }

    // Clean username (remove leading @ and whitespace, turn to lowercase)
    username = username.trim().replace(/^@/, "").toLowerCase();
    storeName = storeName.trim();

    // Check if it already exists
    const existing = await prisma.monitoredInstagram.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta cuenta de Instagram ya está registrada." },
        { status: 400 }
      );
    }

    const newProfile = await prisma.monitoredInstagram.create({
      data: { username, storeName },
    });

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error: any) {
    console.error("Error adding monitored Instagram profile:", error);
    return NextResponse.json(
      { error: "Error al agregar la cuenta de Instagram." },
      { status: 500 }
    );
  }
}

// DELETE: Remove a monitored Instagram profile
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El ID de la cuenta es requerido." },
        { status: 400 }
      );
    }

    await prisma.monitoredInstagram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting monitored Instagram profile:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta de Instagram." },
      { status: 500 }
    );
  }
}

// PUT: Toggle active/enabled state of a monitored profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id || enabled === undefined) {
      return NextResponse.json(
        { error: "El ID de la cuenta y el estado enabled son requeridos." },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.monitoredInstagram.update({
      where: { id },
      data: { enabled: Boolean(enabled) },
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error("Error updating monitored Instagram profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar la cuenta de Instagram." },
      { status: 500 }
    );
  }
}
