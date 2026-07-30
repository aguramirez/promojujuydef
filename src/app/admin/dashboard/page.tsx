"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Eye, Tag, MapPin, Plus, X, Edit, ExternalLink, Calendar } from "lucide-react";
import PromotionDetailModal from "@/components/PromotionDetailModal";
import EventDetailModal from "@/components/EventDetailModal";

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
  instagramPostUrl?: string | null;
  dias?: string[];
  mapsUrl?: string | null;
  status: string;
  published: boolean;
  category?: Category | null;
  categoryId?: string | null;
  createdAt: string;
}

interface Event {
  id: string;
  storeName: string;
  title?: string | null;
  imageUrl: string;
  description: string;
  date: string;
  ctaUrl: string;
  instagramPostUrl?: string | null;
  mapsUrl?: string | null;
  published: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceType, setResourceType] = useState<"promotions" | "events" | "instagram">("promotions");
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "create" | "categories">("active");
  const [detailPromo, setDetailPromo] = useState<Promotion | null>(null);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const router = useRouter();

  // Instagram automation states
  const [monitoredAccounts, setMonitoredAccounts] = useState<{ id: string; username: string; storeName: string; createdAt: string }[]>([]);
  const [newInstagramUser, setNewInstagramUser] = useState("");
  const [newInstagramStore, setNewInstagramStore] = useState("");
  const [agentLogs, setAgentLogs] = useState<{ id: string; jobName: string; postsScraped: number; promosAdded: number; eventsAdded: number; promptTokens: number; completionTokens: number; estimatedCost: number; status: string; error?: string | null; createdAt: string }[]>([]);
  const [syncingInstagram, setSyncingInstagram] = useState(false);

  // Create form states (Promotions)
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

  // Create form states (Events)
  const [eventStoreName, setEventStoreName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventCtaUrl, setEventCtaUrl] = useState("");
  const [eventMapsUrl, setEventMapsUrl] = useState("");
  const [eventImage, setEventImage] = useState<File | null>(null);

  // Category form
  const [newCatName, setNewCatName] = useState("");

  const fetchInstagramData = async () => {
    try {
      const [accountsRes, logsRes] = await Promise.all([
        fetch("/api/admin/instagram"),
        fetch("/api/admin/instagram?logs=true"),
      ]);
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        setMonitoredAccounts(accounts);
      }
      if (logsRes.ok) {
        const logs = await logsRes.json();
        setAgentLogs(logs);
      }
    } catch (e) {
      console.error("Error al cargar datos de automatización:", e);
    }
  };

  const fetchData = async () => {
    const [promoRes, catRes, eventRes] = await Promise.all([
      fetch("/api/admin/promotions"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/events"),
    ]);
    if (promoRes.status === 401) return router.push("/admin");
    const promos = await promoRes.json();
    const cats = await catRes.json();
    const evts = await eventRes.json();
    setPromotions(promos);
    setCategories(cats);
    setEvents(evts);
    await fetchInstagramData();
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

  const handleAddInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstagramUser.trim() || !newInstagramStore.trim()) return;

    const res = await fetch("/api/admin/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newInstagramUser.trim(),
        storeName: newInstagramStore.trim(),
      }),
    });

    if (res.ok) {
      setNewInstagramUser("");
      setNewInstagramStore("");
      await fetchInstagramData();
    } else {
      const data = await res.json();
      alert(data.error || "Error al agregar cuenta");
    }
  };

  const handleDeleteInstagram = async (id: string) => {
    if (!confirm("¿Dejar de monitorear esta cuenta de Instagram?")) return;
    const res = await fetch(`/api/admin/instagram?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchInstagramData();
    } else {
      alert("Error al eliminar cuenta");
    }
  };

  const handleSyncInstagram = async () => {
    setSyncingInstagram(true);
    try {
      const res = await fetch("/api/cron/sync-instagram");
      if (res.ok) {
        const data = await res.json();
        alert(`¡Sincronización terminada!\nPosts scrapeados: ${data.postsScraped}\nPromos creadas: ${data.promosAdded}\nEventos creados: ${data.eventsAdded}\nCosto estimado: $${data.estimatedCostUSD.toFixed(5)} USD`);
        await fetchData();
      } else {
        const data = await res.json();
        alert(`Error al sincronizar: ${data.details || "Verificar consola de logs del servidor"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error de red o servidor al sincronizar.");
    } finally {
      setSyncingInstagram(false);
    }
  };


  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventImage) return alert("Subí una imagen");

    const formData = new FormData();
    formData.append("storeName", eventStoreName);
    if (eventTitle) formData.append("title", eventTitle);
    formData.append("description", eventDescription);
    formData.append("date", eventDate);
    if (eventCtaUrl) formData.append("ctaUrl", eventCtaUrl);
    if (eventMapsUrl) formData.append("mapsUrl", eventMapsUrl);
    formData.append("image", eventImage);

    const res = await fetch("/api/admin/events", { method: "POST", body: formData });
    if (res.ok) {
      alert("¡Evento creado y publicado!");
      setEventStoreName(""); setEventTitle(""); setEventDescription(""); setEventDate(""); setEventCtaUrl(""); setEventMapsUrl(""); setEventImage(null);
      fetchData();
      setActiveTab("active");
    } else {
      alert("Error al crear");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    await fetch("/api/admin/events", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchData();
  };

  const handleApproveEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName: editingEvent.storeName,
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        ctaUrl: editingEvent.ctaUrl,
        mapsUrl: editingEvent.mapsUrl,
        published: true, // Approve sets it to true
      }),
    });

    if (res.ok) {
      alert("¡Evento aprobado y publicado!");
      setEditingEvent(null);
      fetchData();
    } else {
      alert("Error al actualizar");
    }
  };

  const handleTogglePublishEvent = async (id: string, published: boolean) => {
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    fetchData();
  };

  const activePromos = promotions.filter((p) => p.published);
  const pendingPromos = promotions.filter((p) => !p.published);
  const activeEvents = events.filter((e) => e.published);
  const pendingEvents = events.filter((e) => !e.published);

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

      {/* Selector de Recurso */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl w-fit mb-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <button
          onClick={() => { setResourceType("promotions"); setActiveTab("active"); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            resourceType === "promotions"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-md border border-neutral-200/50 dark:border-neutral-800"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          📢 Promociones
        </button>
        <button
          onClick={() => { setResourceType("events"); setActiveTab("active"); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            resourceType === "events"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-md border border-neutral-200/50 dark:border-neutral-800"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          🎟️ Eventos
        </button>
        <button
          onClick={() => { setResourceType("instagram"); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            resourceType === "instagram"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-md border border-neutral-200/50 dark:border-neutral-800"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          🤖 Automatización
        </button>
      </div>

      {/* Tabs */}
      {resourceType !== "instagram" && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {resourceType === "promotions" ? (
            <>
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
            </>
          ) : (
            <>
              <button className={tabClass("active")} onClick={() => setActiveTab("active")}>
                Publicados ({activeEvents.length})
              </button>
              <button className={tabClass("pending")} onClick={() => setActiveTab("pending")}>
                Pendientes
                {pendingEvents.length > 0 && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {pendingEvents.length}
                  </span>
                )}
              </button>
              <button className={tabClass("create")} onClick={() => setActiveTab("create")}>
                + Nuevo Evento
              </button>
            </>
          )}
        </div>
      )}

      {/* PUBLISHED PROMOTIONS TAB */}
      {activeTab === "active" && resourceType === "promotions" && (
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

      {/* PENDING APPROVAL PROMOTIONS TAB */}
      {activeTab === "pending" && resourceType === "promotions" && (
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

      {/* CREATE PROMOTION TAB */}
      {activeTab === "create" && resourceType === "promotions" && (
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
      {activeTab === "categories" && resourceType === "promotions" && (
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

      {/* PUBLISHED EVENTS TAB */}
      {activeTab === "active" && resourceType === "events" && (
        <div className="space-y-4">
          {activeEvents.length === 0 && (
            <p className="text-neutral-400 text-center py-10">No hay eventos publicados.</p>
          )}
          {activeEvents.map((e) => (
            <EventCard 
              key={e.id} 
              event={e} 
              onDelete={handleDeleteEvent} 
              onApprove={() => handleApproveEvent(e)} 
              onTogglePublish={handleTogglePublishEvent}
              onView={() => setDetailEvent(e)}
            />
          ))}
        </div>
      )}

      {/* PENDING EVENTS TAB */}
      {activeTab === "pending" && resourceType === "events" && (
        <div className="space-y-4">
          {pendingEvents.length === 0 && (
            <p className="text-neutral-400 text-center py-10">No hay eventos pendientes de aprobación. 🎉</p>
          )}
          {pendingEvents.map((e) => (
            <EventCard 
              key={e.id} 
              event={e} 
              onDelete={handleDeleteEvent} 
              onApprove={() => handleApproveEvent(e)} 
              onTogglePublish={handleTogglePublishEvent}
              onView={() => setDetailEvent(e)}
              isPending 
            />
          ))}
        </div>
      )}

      {/* CREATE EVENT TAB */}
      {activeTab === "create" && resourceType === "events" && (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 max-w-lg">
          <h2 className="text-lg font-bold mb-4">Nuevo Evento (publicado inmediatamente)</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <input type="text" placeholder="Organizador / Lugar (ej: Teatro Mitre)" value={eventStoreName} onChange={(e) => setEventStoreName(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="text" placeholder="Título del evento (ej: Obra de Teatro)" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <textarea placeholder="Descripción" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <div>
              <label className="text-xs block mb-1 text-neutral-500 font-bold">Fecha del Evento</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="w-full p-3 border rounded-xl bg-transparent text-sm" />
            </div>
            <input type="url" placeholder="URL Botón Entrada (ej: Passline / opcional)" value={eventCtaUrl} onChange={(e) => setEventCtaUrl(e.target.value)} className="w-full p-3 border rounded-xl bg-transparent text-sm" />
            <input type="url" placeholder="Link Google Maps (opcional)" value={eventMapsUrl} onChange={(e) => setEventMapsUrl(e.target.value)} className="w-full p-3 border rounded-xl bg-transparent text-sm" />
            <input type="file" accept="image/*" onChange={(e) => setEventImage(e.target.files?.[0] || null)} required className="w-full text-sm" />
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              Crear y Publicar
            </button>
          </form>
        </div>
      )}

      {/* AUTOMATION (INSTAGRAM) TAB */}
      {resourceType === "instagram" && (
        <div className="space-y-8">
          {/* Top Panel: Action and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Monitor Setup */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm md:col-span-2">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📢 Monitorear Cuentas de Instagram
              </h2>
              <form onSubmit={handleAddInstagram} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Nombre de Usuario (@usuario)</label>
                  <input
                    type="text"
                    placeholder="ej: gomez_burger"
                    value={newInstagramUser}
                    onChange={(e) => setNewInstagramUser(e.target.value)}
                    required
                    className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Comercio Asociado</label>
                  <input
                    type="text"
                    placeholder="ej: Gomez Burger"
                    value={newInstagramStore}
                    onChange={(e) => setNewInstagramStore(e.target.value)}
                    required
                    className="w-full p-3 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    + Agregar Cuenta a Sincronizar
                  </button>
                </div>
              </form>

              {/* Monitored List */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-500">Cuentas Monitoreadas ({monitoredAccounts.length})</h3>
                {monitoredAccounts.length === 0 ? (
                  <p className="text-neutral-400 text-xs py-4">No hay cuentas configuradas aún.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {monitoredAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800"
                      >
                        <div>
                          <span className="font-bold text-sm text-primary">@{acc.username}</span>
                          <span className="text-xs text-neutral-500 ml-2">({acc.storeName})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteInstagram(acc.id)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sync trigger & general metrics */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
              <h2 className="text-lg font-bold">🤖 Ejecución Manual</h2>
              <p className="text-xs text-neutral-400">
                La sincronización automática corre periódicamente (vía Cron). Si agregaste nuevas cuentas o quieres forzar el scraping de inmediato, usa el siguiente botón.
              </p>
              
              <button
                onClick={handleSyncInstagram}
                disabled={syncingInstagram}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                {syncingInstagram ? "Sincronizando..." : "🔄 Sincronizar Ahora"}
              </button>

              {/* Cost calculation display */}
              <div className="border-t pt-4 border-neutral-200 dark:border-neutral-700 space-y-3">
                <h3 className="text-sm font-bold">Consumo del Agente (Gemini AI)</h3>
                
                {(() => {
                  const totalCost = agentLogs.reduce((acc, log) => acc + log.estimatedCost, 0);
                  const totalPromptTokens = agentLogs.reduce((acc, log) => acc + log.promptTokens, 0);
                  const totalCompletionTokens = agentLogs.reduce((acc, log) => acc + log.completionTokens, 0);
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Costo acumulado (15 runs):</span>
                        <span className="font-bold text-emerald-500">${totalCost.toFixed(5)} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tokens de entrada:</span>
                        <span className="font-bold">{totalPromptTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tokens de salida:</span>
                        <span className="font-bold">{totalCompletionTokens.toLocaleString()}</span>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-950/30 p-3 rounded-xl border border-yellow-200 dark:border-yellow-900/50 mt-2 text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">⚠️ Nota de Aprobación Humana</p>
                        <p className="mt-1 text-[10px] leading-relaxed">
                          Las publicaciones incompletas o erróneas se guardan como borradores con estado <strong>pendientes</strong>. Podrás verlas en las pestañas correspondientes de <em>Promociones / Eventos</em> para corregirlas y aprobarlas.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

          {/* Bottom Panel: Logs History */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Historial de Ejecuciones (Logs)</h2>
            {agentLogs.length === 0 ? (
              <p className="text-neutral-400 text-center py-10">No hay registros de ejecución disponibles.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-400 font-medium">
                      <th className="py-2">Fecha / Hora</th>
                      <th className="py-2">Scrapeados</th>
                      <th className="py-2">Promos Creadas</th>
                      <th className="py-2">Eventos Creados</th>
                      <th className="py-2">Costo (USD)</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2">Detalles / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                        <td className="py-3 font-mono">
                          {new Date(log.createdAt).toLocaleString("es-AR", {
                            timeZone: "America/Argentina/Buenos_Aires",
                          })}
                        </td>
                        <td className="py-3">{log.postsScraped}</td>
                        <td className="py-3 text-primary font-semibold">{log.promosAdded}</td>
                        <td className="py-3 text-blue-500 font-semibold">{log.eventsAdded}</td>
                        <td className="py-3 font-semibold text-emerald-500">${log.estimatedCost.toFixed(5)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                                : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 max-w-[200px] truncate text-neutral-400" title={log.error || ""}>
                          {log.error || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <PromotionDetailModal promo={detailPromo} onClose={() => setDetailPromo(null)} />

      {/* EVENT DETAIL MODAL */}
      <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />

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
              
              <div>
                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Días de la Semana Válidos</label>
                <div className="flex flex-wrap gap-2">
                  {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map(day => {
                    const isSelected = (editingPromo.dias || [])
                      .map((d: string) => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                      .includes(day);
                    
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const currentDias = editingPromo.dias || [];
                          const cleanDay = (d: string) => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                          const existingIndex = currentDias.findIndex((d: string) => cleanDay(d) === day);
                          
                          let newDias = [...currentDias];
                          if (existingIndex > -1) {
                            newDias.splice(existingIndex, 1);
                          } else {
                            // Map to standard Spanish capitalized day names with proper accents
                            const standardDayNameMap: Record<string, string> = {
                              lunes: "Lunes",
                              martes: "Martes",
                              miercoles: "Miércoles",
                              jueves: "Jueves",
                              viernes: "Viernes",
                              sabado: "Sábado",
                              domingo: "Domingo"
                            };
                            newDias.push(standardDayNameMap[day]);
                          }
                          setEditingPromo({ ...editingPromo, dias: newDias });
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          isSelected 
                            ? "bg-primary text-white border-primary" 
                            : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-primary/50"
                        }`}
                      >
                        {day === "miercoles" ? "Miércoles" : day === "sabado" ? "Sábado" : day.charAt(0).toUpperCase() + day.slice(1)}
                      </button>
                    );
                  })}
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

      {/* EVENT EDIT/APPROVE MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingEvent(null)} />
          <div className="relative z-10 bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar y Aprobar Evento</h2>
              <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Organizador / Lugar</label>
                  <input 
                    type="text" 
                    value={editingEvent.storeName} 
                    onChange={e => setEditingEvent({...editingEvent, storeName: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">Título del Evento</label>
                  <input 
                    type="text" 
                    value={editingEvent.title || ""} 
                    onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-neutral-500 mb-1 block">Descripción</label>
                <textarea 
                  value={editingEvent.description} 
                  onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} 
                  className="w-full p-2.5 border rounded-xl bg-transparent h-24 resize-none" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 mb-1 block">Fecha</label>
                <input 
                  type="date" 
                  value={new Date(editingEvent.date).toISOString().split('T')[0]} 
                  onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} 
                  className="w-full p-2.5 border rounded-xl bg-transparent" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">URL Entradas</label>
                  <input 
                    type="url" 
                    value={editingEvent.ctaUrl} 
                    onChange={e => setEditingEvent({...editingEvent, ctaUrl: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 mb-1 block">URL Maps</label>
                  <input 
                    type="url" 
                    value={editingEvent.mapsUrl || ""} 
                    onChange={e => setEditingEvent({...editingEvent, mapsUrl: e.target.value})} 
                    className="w-full p-2.5 border rounded-xl bg-transparent" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
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

// Subcomponents
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
          {promo.instagramPostUrl && (
            <a href={promo.instagramPostUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 flex items-center gap-1">
              <ExternalLink className="w-2.5 h-2.5" /> Instagram
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

function EventCard({
  event,
  onDelete,
  onApprove,
  onTogglePublish,
  onView,
  isPending = false,
}: {
  event: Event;
  onDelete: (id: string) => void;
  onApprove: (event: Event) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onView: () => void;
  isPending?: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-neutral-800 p-4 rounded-2xl flex gap-4 items-start shadow-sm border ${isPending ? "border-yellow-300 dark:border-yellow-700" : "border-neutral-200 dark:border-neutral-700"}`}>
      {event.imageUrl && (
        <img src={event.imageUrl} className="w-20 h-20 object-cover rounded-xl shrink-0" alt="" loading="lazy" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm">{event.storeName}</h3>
        {event.title && <p className="text-xs font-semibold text-primary mt-0.5">{event.title}</p>}
        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{event.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> {new Date(event.date).toLocaleDateString("es-AR")}
          </span>
          {event.mapsUrl && (
            <a href={event.mapsUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" /> Maps
            </a>
          )}
          {event.instagramPostUrl && (
            <a href={event.instagramPostUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 flex items-center gap-1">
              <ExternalLink className="w-2.5 h-2.5" /> Instagram
            </a>
          )}
        </div>
        {isPending && (
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">
            ⏳ Pendiente de aprobación — enviado el {new Date(event.createdAt).toLocaleDateString("es-AR")}
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
              onClick={() => onApprove(event)}
              className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Aprobar
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(event)}
              className="flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => onTogglePublish(event.id, false)}
              className="flex items-center justify-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 text-yellow-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Despublicar
            </button>
            <button
              onClick={() => onDelete(event.id)}
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
