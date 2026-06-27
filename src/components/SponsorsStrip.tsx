import Image from "next/image";
import Link from "next/link";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url: string;
}

const SPONSORS: Sponsor[] = [
  {
    id: "s1",
    name: "Estudio Jurídico Arias Cau",
    logo: "/uploads/sponsors/s1.svg",
    url: "https://estudiojuridicoariascau.com.ar/",
  },
];

interface SponsorsStripProps {
  variant?: "hero" | "footer";
}

export default function SponsorsStrip({ variant = "hero" }: SponsorsStripProps) {
  const isFooter = variant === "footer";

  return (
    <div
      className={`w-full overflow-hidden bg-white dark:bg-neutral-900 ${
        isFooter
          ? "py-6 border-t border-neutral-200 dark:border-neutral-800"
          : "py-2 border-t border-b border-neutral-100 dark:border-neutral-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-center ${
          isFooter ? "flex-col gap-3" : "flex-row gap-3"
        }`}>
          <p
            className={`font-semibold tracking-widest uppercase shrink-0 ${
              isFooter
                ? "text-xs text-neutral-500 dark:text-neutral-400"
                : "text-[9px] text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {isFooter ? "Marcas que confían en nosotros" : "Con el apoyo de"}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {SPONSORS.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                title={sponsor.name}
                className="group relative flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={isFooter ? {} : { maxWidth: 140 }}
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={isFooter ? 280 : 140}
                  height={isFooter ? 90 : 32}
                  style={isFooter ? {} : { width: "auto", height: 32, maxWidth: 140 }}
                  className={`block object-contain transition-opacity duration-300 group-hover:opacity-100 drop-shadow-sm ${
                    isFooter ? "opacity-85 h-20 w-auto" : "opacity-75"
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
