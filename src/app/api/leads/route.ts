import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, whatsapp } = await req.json();

    if (!name || !email || !whatsapp) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Ensure WhatsApp has +549 prefix if it doesn't already
    let formattedWhatsapp = whatsapp.trim();
    if (formattedWhatsapp.startsWith('0')) {
      formattedWhatsapp = formattedWhatsapp.substring(1);
    }
    if (formattedWhatsapp.startsWith('15')) {
      formattedWhatsapp = formattedWhatsapp.substring(2);
    }
    if (!formattedWhatsapp.startsWith('+549')) {
      // Remove any non-numeric characters for a cleaner base
      const numericWhatsapp = formattedWhatsapp.replace(/\D/g, '');
      // Add +549 if it doesn't start with 549
      if (!numericWhatsapp.startsWith('549')) {
        formattedWhatsapp = `+549${numericWhatsapp}`;
      } else {
        formattedWhatsapp = `+${numericWhatsapp}`;
      }
    }

    // Save or update the lead based on email
    const lead = await prisma.lead.upsert({
      where: { email },
      update: { name, whatsapp: formattedWhatsapp },
      create: { name, email, whatsapp: formattedWhatsapp },
    });

    return NextResponse.json({ success: true, lead }, { status: 200 });
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json({ error: 'Error al guardar los datos' }, { status: 500 });
  }
}
