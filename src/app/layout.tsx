import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import Image from "next/image";
import MobileUploadMenu from "@/components/MobileUploadMenu";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport = {
  themeColor: "#e63333",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL('https://promojujuy.com.ar'),
  title: {
    default: "PROMO JUJUY | Las mejores promociones de Jujuy",
    template: "%s | PROMO JUJUY"
  },
  description: "Encontrá las mejores promociones, ofertas, descuentos y cupones vigentes en todos los comercios de la provincia de Jujuy, Argentina. ¡Ahorrá todos los días!",
  keywords: ["promociones", "jujuy", "ofertas", "descuentos", "cupones", "comercios jujuy", "ahorro", "promo jujuy", "san salvador de jujuy"],
  authors: [{ name: "agustindev" }],
  openGraph: {
    title: "PROMO JUJUY | Las mejores promociones de Jujuy",
    description: "Encontrá las mejores promociones, ofertas, descuentos y cupones vigentes en todos los comercios de la provincia de Jujuy.",
    url: "https://promojujuy.com.ar",
    siteName: "PROMO JUJUY",
    images: [
      {
        url: "/logo.png",
        width: 311,
        height: 269,
        alt: "Promo Jujuy Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROMO JUJUY | Promos y Descuentos",
    description: "Encontrá las mejores ofertas vigentes en los comercios de Jujuy.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Promo Jujuy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col font-sans relative">
        <header className="w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image src="/logo.svg" alt="Promo Jujuy Logo" width={32} height={32} className="h-8 w-auto" priority />
                <span className="hidden sm:inline font-bold text-xl tracking-tight text-primary">PROMO JUJUY</span>
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors">Promos</Link>
                <Link href="/eventos" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors">Eventos</Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://instagram.com/agustindev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors text-xs font-medium"
              >
                <span>creado por agustindev</span>
                <Image 
                  src="/agustindev.jpg" 
                  alt="agustindev" 
                  width={24} height={24}
                  className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover" 
                />
              </a>
              
              <div className="hidden sm:flex items-center gap-2">
                <Link 
                  href="/promo"
                  className="bg-primary text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-red-700 transition-colors shadow-sm text-center"
                >
                  ¡Subí tu promo acá!
                </Link>
                <Link 
                  href="/eventos/crear"
                  className="bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 rounded-full font-medium text-sm hover:opacity-90 transition-colors shadow-sm text-center"
                >
                  Subir Evento
                </Link>
              </div>

              <MobileUploadMenu />
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="w-full bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <Image src="/logo.svg" alt="Promo Jujuy Logo" width={24} height={24} className="h-6 w-auto" />
              <span className="font-bold text-sm tracking-tight text-neutral-600 dark:text-neutral-400">PROMO JUJUY</span>
            </Link>
            
            <a 
              href="https://instagram.com/agustindev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors text-xs font-medium"
            >
              <span>creado por agustindev</span>
              <Image 
                src="/agustindev.jpg" 
                alt="agustindev" 
                width={24} height={24}
                className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover" 
              />
            </a>
            
            <p className="text-neutral-400 dark:text-neutral-600 text-[10px] mt-2">
              © {new Date().getFullYear()} PROMO JUJUY. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
