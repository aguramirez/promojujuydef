"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Eye, Tag, MapPin, Plus, X, Edit, ExternalLink, Calendar } from "lucide-react";
import PromotionDetailModal from "@/components/PromotionDetailModal";

interface Category {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  ctaUrl: string;
  mapsUrl?: string | null;
  status: string;
  published: boolean;
  category?: Category | null;
  categoryId?: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "create" | "categories">("active");
  const [detailPromo, setDetailPromo] = useState<Promotion | null>(null);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const router = useRouter();

  // Create form states
  const [storeName, setStoreName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [status, setStatus] = useState("NORMAL");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // Category form
  const [newCatName, setNewCatName] = useState("");

  const fetchData = async () => {
    const [promoRes, catRes] = await Promise.all([
      fetch("/api/admin/promotions"),
      fetch("/api/admin/categories"),
    ]);
    if (promoRes.status === 401) return router.push("/admin");
    const promos = await promoRes.json();
    const cats = await catRes.json();
    setPromotions(promos);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return alert("Subí una imagen");

    const formData = new FormData();
    formData.append("storeName", storeName);
    if (title) formData.append("title", title);
    formData.append("description", description);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("ctaUrl", ctaUrl);
    if (mapsUrl) formData.append("mapsUrl", mapsUrl);
    formData.append("status", status);
    if (categoryId) formData.append("categoryId", categoryId);
    formData.append("image", image);

    const res = await fetch("/api/admin/promotions", { method: "POST", body: formData });
    if (res.ok) {
      alert("¡Promoción creada y publicada!");
      setStoreName(""); setTitle(""); setDescription(""); setCtaUrl(""); setMapsUrl(""); setCategoryId(""); setImage(null);
      fetchData();
      setActiveTab("active");
    } else {
      alert("Error al crear");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    await fetch("/api/admin/promotions", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchData();
  };

  const handleApprove = (promo: Promotion) => {
    setEditingPromo(promo);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    const res = await fetch(`/api/admin/promotions/${editingPromo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName: editingPromo.storeName,
        title: editingPromo.title,
        description: editingPromo.description,
        startDate: editingPromo.startDate,
        endDate: editingPromo.endDate,
        ctaUrl: editingPromo.ctaUrl,
        mapsUrl: editingPromo.mapsUrl,
        status: editingPromo.status,
        categoryId: editingPromo.categoryId,
        published: true, // Approve sets it to true
      }),
    });

    if (res.ok) {
      alert("¡Promoción aprobada y publicada!");
      setEditingPromo(null);
      fetchData();
    } else {
      alert("Error al actualizar");
    }
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    await fetch(`/api/admin/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    fetchData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (res.ok) {
      setNewCatName("");
      fetchData();
    } else {
      alert("Error al crear categoría (quizás ya existe)");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const activePromos = promotions.filter((p) => p.published);
  const pendingPromos = promotions.filter((p) => !p.published);

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  const tabClass = (t: typeof activeTab) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      activeTab === t
        ? "bg-primary text-white shadow-md"
        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
    }`;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel Admin — Promo Jujuy</h1>
        <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
          ← Volver a la Web
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button className={tabClass("active")} onClick={() => setActiveTab("active")}>
          Publicadas ({activePromos.length})
        </button>
        <button className={tabClass("pending")} onClick={() => setActiveTab("pending")}>
          Pendientes
          {pendingPromos.length > 0 && (
            <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingPromos.length}
            </span>
          )}
        </button>
        <button className={tabClass("create")} onClick={() => setActiveTab("create")}>
          + Nueva Promo
        </button>
        <button className={tabClass("categories")} onClick={() => setActiveTab("categories")}>
          Categorías ({categories.length})
        </button>
      </div>

      {/* PUBLISHED TAB */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activePromos.length === 0 && (
            <p className="text-neutral-400 text-center py-10">No hay promociones publicadas.</p>
          )}
          {activePromos.map((p) => (
            <PromoCard 
              key={p.id} 
              promo={p} 
              onDelete={handleDelete} 
              onApprove={() => handleApprove(p)} 
              onTogglePublish={handleTogglePublish}
              onView={() => setDetailPromo(p)}
            />
          ))}
        </div>
      )}

      {/* PENDING APPROVAL TAB */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingPromos.length === 0 && (
            <p className="text-neutral-400 text-center py-10">No hay promociones pendientes de aprobación. 🎉</p>
          )}
          {pendingPromos.map((p) => (
            <PromoCard 
              key={p.id} 
              promo={p} 
              onDelete={handleDelete} 
              onApprove={() => handleApprove(p)} 
              onTogglePublish={handleTogglePublish}
              onView={() => setDetailPromo(p)}
              isPending 
            />
          ))}
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === "create" && (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 max-w-lg">
          <h2 className="text-lg font-bold mb-4">Nueva Promoción (publicada inmediatamente)</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder="Nombre del Comercio" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="text" placeholder="Título de la promoción (ej: 2x1 en Pizzas)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1 text-neutral-500">Inicio</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-xs block mb-1 text-neutral-500">Fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm" />
              </div>
            </div>
            <input type="url" placeholder="URL Botón (IG/Web)" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm" />
            <input type="url" placeholder="Link Google Maps (opcional)" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className="w-full p-3 border rounded-xl bg-transparent text-sm" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-neutral-800 text-sm">
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-neutral-800 text-sm">
              <option value="ESTRELLA">⭐ Estrella</option>
              <option value="IMPORTANTE">🔥 Importante</option>
              <option value="NORMAL">Normal</option>
              <option value="ULTIMO">⏰ Últimos días</option>
            </select>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} required className="w-full text-sm" />
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              Crear y Publicar
            </button>
          </form>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="max-w-md space-y-6">
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva categoría..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              className="flex-1 p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" className="bg-primary text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </form>
          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-neutral-400 text-sm text-center py-4">No hay categorías todavía.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-white dark:bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="w-4 h-4 text-primary" />
                  {cat.name}
                </span>
                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <PromotionDetailModal promo={detailPromo} onClose={() => setDetailPromo(null)} />

      {/* EDIT/APPROVE MODAL */}
      {editingPromo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingPromo(null)} />
          <div className="relative z-10 bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar y Aprobar Promoción</h2>
              <button onClick={() => setEditingPromo(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Comercio</label>
                  <input 
                    type="text" 
                    value={editingPromo.storeName} 
                    onChange={e => setEditingPromo({...editingPromo, storeName: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Categoría</label>
                  <select 
                    value={editingPromo.categoryId || ""} 
                    onChange={e => setEditingPromo({...editingPromo, categoryId: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-white dark:bg-neutral-800"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-neutral-500 mb-1 block">Descripción</label>
                <textarea 
                  value={editingPromo.description} 
                  onChange={e => setEditingPromo({...editingPromo, description: e.target.value})} 
                  className="w-full p-2.5 border rounded-xl bg-transparent h-24 resize-none" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Inicio</label>
                  <input 
                    type="date" 
                    value={new Date(editingPromo.startDate).toISOString().split('T')[0]} 
                    onChange={e => setEditingPromo({...editingPromo, startDate: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Fin</label>
                  <input 
                    type="date" 
                    value={new Date(editingPromo.endDate).toISOString().split('T')[0]} 
                    onChange={e => setEditingPromo({...editingPromo, endDate: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">URL Botón</label>
                  <input 
                    type="url" 
                    value={editingPromo.ctaUrl} 
                    onChange={e => setEditingPromo({...editingPromo, ctaUrl: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">URL Maps</label>
                  <input 
                    type="url" 
                    value={editingPromo.mapsUrl || ""} 
                    onChange={e => setEditingPromo({...editingPromo, mapsUrl: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 mb-1 block">Nivel de Importancia</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["ESTRELLA", "IMPORTANTE", "NORMAL", "ULTIMO"].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingPromo({...editingPromo, status: s})}
                      className={`p-2 text-xs font-bold rounded-xl border transition-all ${
                        editingPromo.status === s 
                          ? "bg-primary text-white border-primary" 
                          : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-primary/50"
                      }`}
                    >
                      {s === "ESTRELLA" ? "⭐ Estrella" : s === "IMPORTANTE" ? "🔥 Importante" : s === "ULTIMO" ? "⏰ Último" : "Normal"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar y Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent
function PromoCard({
  promo,
  onDelete,
  onApprove,
  onTogglePublish,
  onView,
  isPending = false,
}: {
  promo: Promotion;
  onDelete: (id: string) => void;
  onApprove: (promo: Promotion) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onView: () => void;
  isPending?: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-neutral-800 p-4 rounded-2xl flex gap-4 items-start shadow-sm border ${isPending ? "border-yellow-300 dark:border-yellow-700" : "border-neutral-200 dark:border-neutral-700"}`}>
      {promo.imageUrl && (
        <img src={promo.imageUrl} className="w-20 h-20 object-cover rounded-xl shrink-0" alt="" loading="lazy" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm">{promo.storeName}</h3>
        {promo.title && <p className="text-xs font-semibold text-primary mt-0.5">{promo.title}</p>}
        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{promo.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.status === "ESTRELLA" ? "bg-yellow-100 text-yellow-700" : "bg-neutral-100 text-neutral-600"}`}>
            {promo.status}
          </span>
          {promo.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {promo.category.name}
            </span>
          )}
          {promo.mapsUrl && (
            <a href={promo.mapsUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" /> Maps
            </a>
          )}
        </div>
        {isPending && (
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">
            ⏳ Pendiente de aprobación — enviada el {new Date(promo.createdAt).toLocaleDateString("es-AR")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={onView}
          className="flex items-center justify-center gap-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Ver Detalle
        </button>
        
        {isPending ? (
          <>
            <button
              onClick={() => onApprove(promo)}
              className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Aprobar
            </button>
            <button
              onClick={() => onDelete(promo.id)}
              className="flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(promo)}
              className="flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => onTogglePublish(promo.id, false)}
              className="flex items-center justify-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 text-yellow-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Despublicar
            </button>
            <button
              onClick={() => onDelete(promo.id)}
              className="flex items-center justify-center gap-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
