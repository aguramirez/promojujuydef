"use client";

import { useEffect } from "react";
import { MapPin, X, Calendar } from "lucide-react";

type Event = {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  date: string | Date;
  ctaUrl: string;
  mapsUrl?: string | null;
};

interface Props {
  event: Event | null;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: Props) {
  // Handle back button on mobile
  useEffect(() => {
    if (!event) return;

    // Push a state so that pressing back triggers popstate
    window.history.pushState({ modal: event.id }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [event, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [event]);

  if (!event) return null;

  const handleClose = () => {
    // Go back in history to remove the state we pushed
    if (window.history.state?.modal) {
      window.history.back();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${event.storeName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 bg-white dark:bg-neutral-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-slide-up">
        {/* Image */}
        <div className="relative w-full bg-neutral-100 dark:bg-neutral-950 shrink-0 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
          {event.imageUrl ? (
            <>
              {/* Blurred background image for premium ambient effect */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${event.imageUrl})` }}
              />
              <img
                src={event.imageUrl}
                alt={event.storeName}
                className="relative z-10 w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain"
              />
            </>
          ) : (
            <div className="w-full h-52 sm:h-64 flex items-center justify-center text-neutral-400 text-sm">
              Sin imagen
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 transition-all"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Store name & Title */}
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              {event.storeName}
            </h2>
            {event.title && (
              <p className="text-primary font-bold text-base mt-1">{event.title}</p>
            )}
          </div>

          {/* Description */}
          <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
            {event.description}
          </p>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            <span>
              Fecha del evento: <strong>{new Date(event.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</strong>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-2">
            {event.ctaUrl && event.ctaUrl !== "#" && (
              <a
                href={event.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Sacar entrada / Ver link
              </a>
            )}

            {event.mapsUrl && (
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Ver ubicación
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @media (min-width: 640px) {
          @keyframes slide-up {
            from { transform: translateY(20px) scale(0.97); opacity: 0; }
            to   { transform: translateY(0)    scale(1);    opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
