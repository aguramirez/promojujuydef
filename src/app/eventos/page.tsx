import { prisma } from "@/lib/prisma";
import EventsGrid from "@/components/EventsGrid";

export const revalidate = 60; // Cache page for 60 seconds (ISR)

export default async function EventosPage() {
  // Fetch events from today onwards
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allEvents = await prisma.event.findMany({
    where: { 
      published: true,
      date: {
        gte: today,
      }
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-28">
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #E63333 0%, transparent 70%)" }}
        />
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center relative z-10">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            🎟️ Próximos eventos
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-5 tracking-tight leading-tight">
            Descubrí qué hacer en{" "}
            <span className="text-primary">Jujuy</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto mb-6 sm:mb-0">
            Encontrá las mejores obras, fiestas y eventos. ¡No te quedes sin tu entrada!
          </p>
        </div>
      </section>

      {/* Events List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <EventsGrid events={JSON.parse(JSON.stringify(allEvents))} />
      </section>
    </div>
  );
}
