"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, MapPin, Tag, Calendar, Store, FileText, Link } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function PromoSubmitPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-100 dark:border-neutral-800 p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-3">
            ¡Promoción guardada!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <strong>PROMO JUJUY</strong> está revisando tu publicación.{" "}
            <span className="text-primary font-semibold">Pronto la verás en la web.</span>
          </p>
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
            }}
            className="mt-8 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Subir otra promo
          </button>
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
