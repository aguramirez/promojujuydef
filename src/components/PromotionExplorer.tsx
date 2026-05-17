"use client";

import { useState, useEffect } from "react";
import WeeklyCalendar from "./WeeklyCalendar";
import PromotionsGrid from "./PromotionsGrid";
import { Tag, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  storeName: string;
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  ctaUrl: string;
  mapsUrl?: string | null;
  status: string;
  category?: Category | null;
}

const TZ = "America/Argentina/Buenos_Aires";

function getBAToday(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get("year"), get("month") - 1, get("day"));
}

const STATUS_ORDER: Record<string, number> = {
  ESTRELLA: 1,
  IMPORTANTE: 2,
  NORMAL: 3,
  ULTIMO: 4,
};

export default function PromotionExplorer({ allPromotions }: { allPromotions: Promotion[] }) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const todayBA = getBAToday();
    // The selected date is today + offset
    const selectedDate = new Date(todayBA);
    selectedDate.setDate(selectedDate.getDate() + selectedDayOffset);

    // Normalize to midnight for comparison
    const selStart = selectedDate.getTime();
    const selEnd   = selStart + 86_400_000 - 1; // end of day

    const filtered = allPromotions
      .filter((p) => {
        // Category filter
        if (selectedCategory && p.category?.id !== selectedCategory) return false;

        // Date range: promo active during selected day
        const start = new Date(p.startDate).getTime();
        const end   = new Date(p.endDate).getTime();
        return start <= selEnd && end >= selStart;
      })
      .sort((a, b) => (STATUS_ORDER[a.status] || 5) - (STATUS_ORDER[b.status] || 5));

    setFilteredPromotions(filtered);
  }, [selectedDayOffset, allPromotions, selectedCategory]);

  return (
    <>
      <section className="max-w-7xl mx-auto pt-8 pb-2">
        <WeeklyCalendar onSelectDay={setSelectedDayOffset} />
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                !selectedCategory
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary/50"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary/50"
                }`}
              >
                <Tag className="w-3 h-3" />
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Promociones del Día
          </h2>
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                <X className="w-3 h-3" /> Limpiar filtro
              </button>
            )}
            <span className="text-sm text-neutral-400 font-medium">
              {filteredPromotions.length} disponibles
            </span>
          </div>
        </div>
        <PromotionsGrid promotions={filteredPromotions} />
      </section>
    </>
  );
}
