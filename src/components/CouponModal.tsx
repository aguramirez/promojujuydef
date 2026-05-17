"use client";

import { useState, useRef } from "react";
import { X, Download, Loader2, Ticket } from "lucide-react";

interface Promotion {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
}

interface Props {
  promo: Promotion | null;
  onClose: () => void;
}

/** Load an image URL into a canvas data URL, preserving aspect ratio */
async function imgToDataUrl(src: string): Promise<{ data: string; aspect: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspect = img.naturalHeight / img.naturalWidth;
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve({ data: c.toDataURL("image/jpeg", 0.85), aspect });
    };
    img.onerror = () => resolve({ data: "", aspect: 0.66 });
    img.src = src;
  });
}

export default function CouponModal({ promo, onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!promo) return null;

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  const handleGenerate = async () => {
    if (!name.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);

    try {
      const jsPDF = (await import("jspdf")).default;
      const W = 210; const H = 297;

      // ── load assets ──────────────────────────────────────────────
      const [logoPng, promoImg] = await Promise.all([
        imgToDataUrl('/logo-pdf.png').then(res => res.data),
        promo.imageUrl ? imgToDataUrl(promo.imageUrl) : Promise.resolve({ data: "", aspect: 0.66 }),
      ]);

      // ── init doc ──────────────────────────────────────────────────
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // ── Background ────────────────────────────────────────────────
      doc.setFillColor(248, 248, 248);
      doc.rect(0, 0, W, H, "F");

      // ── Header band ───────────────────────────────────────────────
      doc.setFillColor(196, 30, 40);
      doc.rect(0, 0, W, 28, "F");

      // Calculate widths to center the logo and text together
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      
      const text = "PROMO JUJUY";
      const textWidth = doc.getTextWidth(text);
      const lh = 18;
      const lw = lh * (311 / 269);
      const gap = 4;
      const totalWidth = lw + gap + textWidth;
      const startX = (W - totalWidth) / 2;

      // Logo inside the red band
      if (logoPng) {
        doc.addImage(logoPng, "PNG", startX, 5, lw, lh);
      }

      // Text inside the red band
      doc.setTextColor(255, 255, 255);
      doc.text(text, startX + lw + gap, 18);

      // ── Coupon title area ─────────────────────────────────────────
      const titleText = promo.title || promo.storeName;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(titleText.toUpperCase(), 180);
      doc.text(titleLines, W / 2, 44, { align: "center" });

      let curY = 44 + titleLines.length * 8;

      // Store name below (if title differs)
      if (promo.title) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(130, 130, 130);
        doc.text(promo.storeName, W / 2, curY + 2, { align: "center" });
        curY += 8;
      }

      // "Para:" label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text("Para:", W / 2, curY + 6, { align: "center" });
      curY += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(196, 30, 40);
      doc.text(name.trim(), W / 2, curY + 7, { align: "center" });
      curY += 12;

      // ── Promo image ───────────────────────────────────────────────
      if (promoImg.data) {
        const maxImgW = 170;
        const maxImgH = 90;
        let imgW = maxImgW;
        let imgH = maxImgW * promoImg.aspect;
        if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH / promoImg.aspect; }
        const imgX = (W - imgW) / 2;
        const imgY = curY + 4;

        // Shadow / border effect
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(imgX + 1, imgY + 1, imgW, imgH, 4, 4, "F");
        doc.addImage(promoImg.data, "JPEG", imgX, imgY, imgW, imgH);
        curY = imgY + imgH + 8;
      } else {
        curY += 4;
      }



      // ── Description ───────────────────────────────────────────────
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(promo.description, 168);
      doc.text(descLines, W / 2, curY, { align: "center" });
      curY += descLines.length * 5 + 6;

      // ── Validity card ─────────────────────────────────────────────
      doc.setFillColor(255, 245, 245);
      doc.setDrawColor(196, 30, 40);
      doc.setLineWidth(0.3);
      doc.roundedRect(16, curY, W - 32, 14, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(196, 30, 40);
      doc.text("VALIDO DEL", W / 2, curY + 5.5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(
        `${formatDate(promo.startDate)}  -  ${formatDate(promo.endDate)}`,
        W / 2,
        curY + 10.5,
        { align: "center" }
      );
      curY += 20;

      // ── Instructions ──────────────────────────────────────────────
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(130, 130, 130);
      doc.text(
        "Presentar este cupon en el local al momento de la compra.",
        W / 2,
        curY,
        { align: "center" }
      );

      // ── Footer band ───────────────────────────────────────────────
      doc.setFillColor(196, 30, 40);
      doc.rect(0, H - 18, W, 18, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("promojujuy.com.ar  |  Jujuy, Argentina", W / 2, H - 7, { align: "center" });

      // ── Save ──────────────────────────────────────────────────────
      const safeStore = promo.storeName.replace(/[^a-zA-Z0-9]/g, "_");
      const safeName = name.trim().replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`cupon_${safeStore}_${safeName}.pdf`);

      onClose();
      setName("");
    } catch (err) {
      console.error("PDF error:", err);
      alert("No se pudo generar el cupon. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-primary px-6 pt-6 pb-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Ticket className="w-7 h-7" />
            <span className="font-extrabold text-xl">Usar cupon</span>
          </div>
          <p className="text-white/80 text-sm">
            {promo.title || promo.storeName}
          </p>
        </div>

        {/* Scalloped edge */}
        <div className="relative -mt-4 h-5 overflow-hidden bg-white dark:bg-neutral-900 flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-7 h-7 rounded-full bg-black/0 -mt-3.5 border-t-4 border-primary"
              style={{ background: "transparent" }}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-1 space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Ingresa tu nombre para generar y descargar tu cupon personalizado.
          </p>
          <div>
            <label className="text-xs font-bold text-neutral-500 block mb-1">Tu nombre *</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Ej: Maria Gonzalez"
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !name.trim()}
            className="w-full bg-primary hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar mi cupon
              </>
            )}
          </button>

          <p className="text-[10px] text-neutral-400 text-center">
            El cupon se descarga a tu dispositivo. No guardamos tu nombre.
          </p>
        </div>
      </div>
    </div>
  );
}
