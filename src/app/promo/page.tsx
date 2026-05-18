"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, MapPin, Tag, Calendar, Store, FileText, Link, User } from "lucide-react";

// Icono de WhatsApp SVG personalizado (Original Brand Logo)
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.18-1.15l-.3-.18l-3.11.82l.83-3.04l-.2-.31a8.18 8.18 0 0 1-1.25-4.38c0-4.51 3.67-8.19 8.19-8.19c2.19 0 4.25.85 5.8 2.4c1.55 1.55 2.4 3.61 2.4 5.8c0 4.52-3.67 8.19-8.18 8.19zm4.48-6.13c-.24-.12-1.45-.72-1.68-.8c-.23-.08-.39-.12-.56.12c-.17.25-.66.8-.81.98c-.15.17-.3.2-.54.08c-.24-.12-.99-.36-1.89-1.17c-.7-.63-1.17-1.4-1.31-1.64c-.14-.24-.01-.37.11-.49c.11-.11.24-.28.36-.42c.12-.14.16-.24.24-.4c.08-.16.04-.3-.02-.42c-.06-.12-.56-1.35-.77-1.85c-.2-.5-.44-.43-.6-.44c-.16-.01-.34-.01-.52-.01c-.18 0-.48.07-.73.34c-.25.27-.97.95-.97 2.33s1 2.7 1.14 2.9c.14.2 1.96 3 4.75 4.2c.66.29 1.18.46 1.58.59c.7.22 1.34.19 1.84.12c.56-.08 1.68-.69 1.92-1.36c.24-.66.24-1.23.17-1.35c-.08-.12-.29-.19-.53-.31z" />
  </svg>
);

interface Category {
  id: string;
  name: string;
}

export default function PromoSubmitPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactName, setContactName] = useState("");

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Por favor subí una imagen de tu promoción.");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("storeName", storeName);
    if (title) formData.append("title", title);
    formData.append("description", description);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    if (ctaUrl) formData.append("ctaUrl", ctaUrl);
    if (mapsUrl) formData.append("mapsUrl", mapsUrl);
    if (categoryId) formData.append("categoryId", categoryId);
    formData.append("image", image);

    try {
      const res = await fetch("/api/promotions/submit", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Hubo un error al guardar. Intentá de nuevo.");
      }
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const handleWhatsAppClick = () => {
      const message = `Hola! acabo de subir una promocion! soy ${contactName.trim()} de ${storeName}`;
      const whatsappUrl = `https://wa.me/5493885056441?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    };

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-100 dark:border-neutral-800 p-8 sm:p-10 text-center space-y-6">
          
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
              ¡Promoción guardada!
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <strong>PROMO JUJUY</strong> está revisando tu publicación. Pronto la verás en la web.
            </p>
          </div>

          {/* Tarjeta de Activación Inmediata por WhatsApp */}
          <div className="bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800/80 text-left space-y-4">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              ⚡ Activación Inmediata
            </h3>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed space-y-2">
              <p>
                Para evitar promociones falsas y verificar tu identidad como representante de <span className="font-semibold text-primary">{storeName}</span>, avisanos por WhatsApp.
              </p>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 rounded-xl p-3 text-[11px] text-neutral-600 dark:text-neutral-300">
                💡 Al abrir el chat, envianos una captura de tu <strong>perfil de Instagram comercial con la sesión iniciada</strong> u otra prueba de vínculo (tarjeta de presentación, factura a nombre del negocio, etc.).
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                Tu Nombre y Apellido
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-400" />
                </span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-[#25D366] transition-all dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleWhatsAppClick}
              disabled={!contactName.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-green-500/20 active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 fill-white flex-shrink-0" />
              Avisá que subiste tu promo acá
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSubmitted(false);
                setStoreName("");
                setTitle("");
                setDescription("");
                setStartDate("");
                setEndDate("");
                setCtaUrl("");
                setMapsUrl("");
                setCategoryId("");
                setImage(null);
                setImagePreview(null);
                setContactName("");
              }}
              className="text-xs font-semibold text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors underline cursor-pointer"
            >
              Subir otra promo
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Hero */}
      <section className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-12 px-4 text-center">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
          🏪 Para comercios
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white mb-4">
          Publicá tu <span className="text-primary">promoción gratis</span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm sm:text-base">
          Completá el formulario y tu promo será revisada por nuestro equipo. Una vez aprobada, aparecerá en la web para que todos los usuarios de Jujuy la vean.
        </p>
      </section>

      {/* Form */}
      <div className="max-w-xl mx-auto px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 p-6 sm:p-8 space-y-6"
        >
          {/* Store Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <Store className="w-4 h-4 text-primary" />
              Nombre del comercio *
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="Ej: Pizzeria El Rincon"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Titulo de la promocion *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: 2x1 en Pizzas grandes"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Descripción de la promoción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Ej: 2x1 en todas las pizzas grandes los lunes. Presentá este anuncio en caja."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                Inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                Fin *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
              disabled={categories.length === 0}
            >
              <option value="">{categories.length === 0 ? "No hay categorías disponibles" : "Seleccioná una categoría"}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-[10px] text-neutral-400 mt-1">
                Aparecerán cuando el administrador las cree.
              </p>
            )}
          </div>

          {/* CTA URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <Link className="w-4 h-4 text-primary" />
              Link de tu Instagram o Web (opcional)
            </label>
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://instagram.com/tucomercio"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Maps URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Link de Google Maps (opcional)
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Abrí Google Maps, buscá tu local, compartir → Copiar link
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <Upload className="w-4 h-4 text-primary" />
              Imagen de la promoción *
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-3 py-1 text-xs hover:bg-black/70 transition-all"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                <span className="text-sm text-neutral-500">Hacer clic para subir imagen</span>
                <span className="text-xs text-neutral-400 mt-1">JPG, PNG, WEBP (máx. 10 MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Enviar promoción
              </>
            )}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Al enviar, aceptás que PROMO JUJUY revise y publique tu contenido en la plataforma.
          </p>
        </form>
      </div>
    </div>
  );
}
