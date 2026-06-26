import { prisma } from "@/lib/prisma";
import PromotionExplorer from "@/components/PromotionExplorer";
import ChatBox from "@/components/ai/ChatBox";
import Image from "next/image";
import SponsorsStrip from "@/components/SponsorsStrip";

export const revalidate = 60; // Cache page for 60 seconds (ISR) for ultra-fast load times

export default async function Home() {
  const allPromotions = await prisma.promotion.findMany({
    where: { published: true },
    include: { category: true },
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-28">
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #E63333 0%, transparent 70%)" }}
        />
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center relative z-10">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            🎁 Nuevas promos cada día
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-5 tracking-tight leading-tight">
            Las mejores ofertas de{" "}
            <span className="text-primary">Jujuy</span>,<br />
            en un solo lugar.
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto mb-6 sm:mb-0">
            Publicidad gratuita para comercios locales y los mejores descuentos semanales para vos. Elegí el día y descubrí qué hay de nuevo.
          </p>
          
          <a 
            href="https://instagram.com/agustindev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex sm:hidden items-center justify-center gap-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors text-[10px] font-medium opacity-70 hover:opacity-100 mx-auto"
          >
            <span>creado por agustindev</span>
            <Image 
              src="/agustindev.jpg" 
              alt="agustindev" 
              width={20} height={20}
              className="w-5 h-5 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover" 
            />
          </a>
        </div>
      </section>

      {/* Sponsors Strip - Hero */}
      <SponsorsStrip variant="hero" />

      {/* Promotion Content */}
      <PromotionExplorer allPromotions={JSON.parse(JSON.stringify(allPromotions))} />

      {/* Floating AI ChatBox */}
      <ChatBox />
    </div>
  );
}
