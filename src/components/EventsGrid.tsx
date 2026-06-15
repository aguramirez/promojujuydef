"use client";

import { MapPin, Calendar, ExternalLink, Ticket } from "lucide-react";

type Event = {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  date: string | Date;
  ctaUrl: string;
  mapsUrl?: string | null;
  status: string;
};

export default function EventsGrid({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <p className="text-lg">No hay eventos próximos.</p>
        <p className="text-sm mt-2">¡Volvé más tarde para descubrir nuevos eventos!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => {
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        return (
          <div
            key={event.id}
            className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-lg border border-neutral-100 dark:border-neutral-800 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl group"
          >
            {/* Image */}
            <div className="relative h-48 sm:h-56 w-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              {event.imageUrl ? (
                <img 
                  src={event.imageUrl} 
                  alt={event.title || event.storeName} 
                  loading="lazy" 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-neutral-400 text-xs">Sin imagen</div>
              )}
              
              {/* Date Badge */}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-black/90 backdrop-blur-md px-3 py-2 rounded-xl text-center shadow-lg border border-white/20">
                <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mb-1">
                  {eventDate.toLocaleDateString("es-AR", { month: "short" })}
                </span>
                <span className="block text-xl font-black text-neutral-900 dark:text-white leading-none">
                  {eventDate.getDate()}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <h3 className="font-extrabold text-lg sm:text-xl mb-1 text-neutral-900 dark:text-white line-clamp-2">
                {event.title || event.storeName}
              </h3>
              <p className="text-primary font-bold text-xs sm:text-sm mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.storeName}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-4 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg w-fit">
                <Calendar className="w-3.5 h-3.5" />
                <span className="capitalize">{dateStr}</span>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                {event.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                {event.ctaUrl && event.ctaUrl !== "#" ? (
                  <a
                    href={event.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md hover:shadow-red-500/20 active:scale-[0.98]"
                  >
                    <Ticket className="w-4 h-4" />
                    Sacar entrada
                  </a>
                ) : (
                  <button disabled className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 py-3.5 rounded-xl font-bold cursor-not-allowed">
                    Entradas no disponibles online
                  </button>
                )}
                
                {event.mapsUrl && (
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-neutral-50 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 py-3 rounded-xl font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-sm active:scale-[0.98]"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver en mapa
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
