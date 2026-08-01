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
  instagramPostUrl?: string | null;
};

interface Props {
  event: Event | null;
  onClose: () => void;
}

const handleInstagramClick = (e: React.MouseEvent, url: string) => {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const match = url.match(/(?:\/p\/|\/reel\/|\/tv\/)([A-Za-z0-9_-]+)/);
      let deepLink = url;
      if (match && match[1]) {
        deepLink = `instagram://p/${match[1]}/`;
      } else {
        const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
        if (userMatch && userMatch[1] && !["p", "reel", "tv", "stories"].includes(userMatch[1])) {
          deepLink = `instagram://user?username=${userMatch[1]}`;
        }
      }
      window.location.href = deepLink;
      e.preventDefault();
    }
  }
};

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
            {/* Instagram Link (Always visible if exists) */}
            {(() => {
              const instagramUrl = event.instagramPostUrl || (event.ctaUrl?.includes("instagram.com") ? event.ctaUrl : null);
              if (!instagramUrl) return null;
              return (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleInstagramClick(e, instagramUrl)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white py-3 rounded-xl font-semibold transition-all text-sm shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  Ver en Instagram
                </a>
              );
            })()}

            {/* Ticket Link / External Event Website (If distinct from Instagram) */}
            {(() => {
              const hasTicketLink = event.ctaUrl && 
                event.ctaUrl !== "#" && 
                !event.ctaUrl.includes("instagram.com") && 
                event.ctaUrl !== event.instagramPostUrl &&
                (event.ctaUrl.startsWith("http://") || event.ctaUrl.startsWith("https://"));
              if (!hasTicketLink) return null;
              return (
                <a
                  href={event.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
                >
                  Sacar entrada / Ver link
                </a>
              );
            })()}

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
