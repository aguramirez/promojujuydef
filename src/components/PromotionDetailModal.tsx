"use client";

import { useEffect } from "react";
import { MapPin, ExternalLink, X, Calendar, Tag, Ticket } from "lucide-react";

type Promotion = {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  ctaUrl: string;
  mapsUrl?: string | null;
  status: string;
  category?: { id: string; name: string } | null;
};

interface Props {
  promo: Promotion | null;
  onClose: () => void;
  onCoupon?: (promo: Promotion) => void;
}

export default function PromotionDetailModal({ promo, onClose, onCoupon }: Props) {
  // Handle back button on mobile
  useEffect(() => {
    if (!promo) return;

    // Push a state so that pressing back triggers popstate
    window.history.pushState({ modal: promo.id }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [promo, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (promo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [promo]);

  if (!promo) return null;

  const handleClose = () => {
    // Go back in history to remove the state we pushed
    if (window.history.state?.modal) {
      window.history.back();
    } else {
      onClose();
    }
  };

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  const STATUS_LABELS: Record<string, string | null> = {
    ESTRELLA: "⭐ Destacada",
    IMPORTANTE: null,
    NORMAL: null,
    ULTIMO: null,
  };

  const STATUS_COLORS: Record<string, string> = {
    ESTRELLA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    IMPORTANTE: "bg-orange-100 text-orange-700 border-orange-200",
    NORMAL: "bg-primary/10 text-primary border-primary/20",
    ULTIMO: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${promo.storeName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 bg-white dark:bg-neutral-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-slide-up">
        {/* Image */}
        <div className="relative h-52 sm:h-64 w-full bg-neutral-200 dark:bg-neutral-800 shrink-0">
          {promo.imageUrl ? (
            <img
              src={promo.imageUrl}
              alt={promo.storeName}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
              Sin imagen
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Status badge */}
          {STATUS_LABELS[promo.status] && (
            <span
              className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full border ${
                STATUS_COLORS[promo.status] || STATUS_COLORS.NORMAL
              }`}
            >
              {STATUS_LABELS[promo.status]}
            </span>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 transition-all"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Store name */}
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              {promo.storeName}
            </h2>
            {promo.title && (
              <p className="text-primary font-bold text-base mt-1">{promo.title}</p>
            )}
            {promo.category && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {promo.category.name}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
            {promo.description}
          </p>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            <span>
              Válida del <strong>{formatDate(promo.startDate)}</strong> al{" "}
              <strong>{formatDate(promo.endDate)}</strong>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Coupon CTA — primary action */}
            {onCoupon && (
              <button
                onClick={() => onCoupon(promo)}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors text-sm"
              >
                <Ticket className="w-4 h-4" />
                Usar este cupón
              </button>
            )}

            {promo.mapsUrl && (
              <a
                href={promo.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                Ver ubicación en Google Maps
              </a>
            )}

            {promo.ctaUrl && promo.ctaUrl !== "#" && (
              <a
                href={promo.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 py-3 rounded-xl font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
              >
                Ir al comercio
                <ExternalLink className="w-4 h-4" />
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
