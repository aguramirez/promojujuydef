"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Tag, Calendar } from "lucide-react";

export default function MobileUploadMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative sm:hidden" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
      >
        <Plus className={`w-5 h-5 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col gap-1 z-50">
          <Link 
            href="/promo"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors text-sm font-semibold text-neutral-800 dark:text-neutral-200"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-primary flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            Subir Promo
          </Link>
          <Link 
            href="/eventos/crear"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors text-sm font-semibold text-neutral-800 dark:text-neutral-200"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            Subir Evento
          </Link>
        </div>
      )}
    </div>
  );
}
