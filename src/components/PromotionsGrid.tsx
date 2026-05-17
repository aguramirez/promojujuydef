"use client";

import { useState } from "react";
import { Calendar, MapPin, ExternalLink, Eye, Tag, Ticket } from "lucide-react";
import PromotionDetailModal from "./PromotionDetailModal";
import CouponModal from "./CouponModal";

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

const STATUS_BADGE: Record<string, { label: string; cls: string } | null> = {
  ESTRELLA:  { label: "⭐ Destacada", cls: "bg-yellow-100 text-yellow-700" },
  IMPORTANTE: null,
  NORMAL:    null,
  ULTIMO:    null,
};

export default function PromotionsGrid({ promotions }: { promotions: Promotion[] }) {
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [couponPromo, setCouponPromo] = useState<Promotion | null>(null);

  if (promotions.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <p className="text-lg">No hay promociones disponibles para este filtro.</p>
        <p className="text-sm mt-2">¡Volvé más tarde o elegí otra categoría!</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid: 2 cols on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {promotions.map((promo) => {
          const badge = STATUS_BADGE[promo.status];
          return (
            <div
              key={promo.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md border border-neutral-100 dark:border-neutral-800 flex flex-col transition-transform hover:scale-[1.02] group cursor-pointer"
              onClick={() => setSelectedPromo(promo)}
            >
              {/* Image */}
              <div className="relative h-32 sm:h-48 w-full bg-neutral-200 dark:bg-neutral-800">
                {promo.imageUrl ? (
                  <img src={promo.imageUrl} alt={promo.storeName} loading="lazy" className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-neutral-400 text-xs">Sin imagen</div>
                )}
                {badge && (
                  <div className={`absolute top-2 left-2 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm ${badge.cls}`}>
                    <span>{badge.label}</span>
                  </div>
                )}
                {promo.category && (
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">{promo.category.name}</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-3 sm:p-5 flex flex-col flex-1">
                <h3 className="font-bold text-xs sm:text-xl mb-0.5 sm:mb-1 text-neutral-900 dark:text-white flex items-center gap-1 sm:gap-2 line-clamp-1">
                  <MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-primary shrink-0" />
                  {promo.storeName}
                </h3>
                {promo.title && (
                  <p className="text-primary font-semibold text-[10px] sm:text-sm mb-1 line-clamp-1">{promo.title}</p>
                )}
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] sm:text-sm mb-3 flex-1 line-clamp-2 sm:line-clamp-3">
                  {promo.description}
                </p>

                {/* Desktop buttons — hidden on mobile */}
                <div className="hidden sm:flex gap-2 mt-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPromo(promo); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 py-3 rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalle
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCouponPromo(promo); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm"
                  >
                    <Ticket className="w-4 h-4" />
                    Cupón
                  </button>
                </div>

                {/* Mobile: just a subtle "tap to open" hint */}
                <div className="flex sm:hidden items-center justify-center gap-1 text-[10px] text-neutral-400 mt-1">
                  <Eye className="w-2.5 h-2.5" />
                  Ver detalle
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PromotionDetailModal
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        onCoupon={(p) => { setSelectedPromo(null); setCouponPromo(p); }}
      />
      <CouponModal promo={couponPromo} onClose={() => setCouponPromo(null)} />
    </>
  );
}
