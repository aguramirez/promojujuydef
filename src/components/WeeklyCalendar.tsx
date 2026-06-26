"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const TZ = "America/Argentina/Buenos_Aires";
const MAX_WEEKS = 3; // current + 2 more

/** Returns today as a plain Date in Argentina local time (midnight) */
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

/** 0=Mon … 6=Sun */
function getWeekIndex(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 6 : js - 1;
}

/** Add days to a date */
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export default function WeeklyCalendar({
  onSelectDay,
}: {
  onSelectDay: (absoluteDayIndex: number) => void;
}) {
  const [todayBA, setTodayBA] = useState<Date | null>(null);
  const [todayWeekIdx, setTodayWeekIdx] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = this week, 1 = next, 2 = in 2 weeks
  const [selectedAbsDay, setSelectedAbsDay] = useState(0); // absolute offset from today

  useEffect(() => {
    const ba = getBAToday();
    const idx = getWeekIndex(ba);
    setTodayBA(ba);
    setTodayWeekIdx(idx);
    setSelectedAbsDay(0);
    onSelectDay(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!todayBA) return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="w-24 h-4 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    </div>
  );

  /** For week `w` and weekday index `d` (0=Mon), return the real Date */
  const dateFor = (week: number, dayIdx: number): Date => {
    // How far is Monday of week `week` from today?
    const mondayOffset = -todayWeekIdx + week * 7;
    return addDays(todayBA, mondayOffset + dayIdx);
  };

  /** Absolute offset from today for a given week+day */
  const absOffset = (week: number, dayIdx: number): number => {
    const d = dateFor(week, dayIdx);
    return Math.round((d.getTime() - todayBA.getTime()) / 86_400_000);
  };

  const handleSelect = (week: number, dayIdx: number) => {
    const offset = absOffset(week, dayIdx);
    setSelectedAbsDay(offset);
    onSelectDay(offset);
  };

  const today = new Date(todayBA);

  return (
    <div className="w-full px-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentWeek((w) => Math.max(0, w - 1))}
          disabled={currentWeek === 0}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {currentWeek === 0
            ? "Esta semana"
            : currentWeek === 1
            ? "Próxima semana"
            : "En 2 semanas"}
        </span>

        <button
          onClick={() => setCurrentWeek((w) => Math.min(MAX_WEEKS - 1, w + 1))}
          disabled={currentWeek === MAX_WEEKS - 1}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days row */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAYS_SHORT.map((shortName, dayIdx) => {
          const realDate = dateFor(currentWeek, dayIdx);
          const offset = absOffset(currentWeek, dayIdx);
          const isToday = realDate.toDateString() === today.toDateString();
          const isPast = realDate < today;
          const isSelected = offset === selectedAbsDay;

          const dateLabel = new Intl.DateTimeFormat("es-AR", {
            day: "numeric",
            month: "short",
            timeZone: TZ,
          }).format(realDate);

          return (
            <button
              key={dayIdx}
              onClick={() => handleSelect(currentWeek, dayIdx)}
              disabled={isPast && !isToday}
              className={`flex-1 min-w-0 flex flex-col items-center px-1 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-white scale-105 shadow-md"
                  : isPast && !isToday
                  ? "bg-white dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                  : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
            >
              <span className="text-[11px] sm:text-sm leading-tight font-bold">
                {isToday ? "Hoy" : shortName}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-normal leading-tight mt-0.5 ${
                  isSelected ? "text-white/80" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {dateLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
