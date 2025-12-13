import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Handshake, Loader2, MessageCircle, Plus, Search, Sparkles } from "lucide-react";
import type { Lead, LeadChannel, LeadStatus } from "../types";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LeadCard from "../components/LeadCard";
import { useDebounce } from "../hooks/useDebounce";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import LeadFormModal from "../components/LeadFormModal";

const statusOptions: { label: string; value: LeadStatus | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Enviado", value: "MANDADO" },
  { label: "Visualizou", value: "VISUALIZOU" },
  { label: "Respondeu", value: "RESPONDEU" },
  { label: "Negociando", value: "NEGOCIANDO" },
  { label: "Fechado", value: "FECHADO" },
];

const channelOptions: { label: string; value: LeadChannel | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Outro", value: "OUTRO" },
];

type Filters = {
  status: LeadStatus | "ALL";
  channel: LeadChannel | "ALL";
  search: string;
};

const FIRST_MESSAGE =
  "Oi, tudo bem?\n\nAqui é o Dev Ivan, da Maximos Code.\n\nEu crio landing pages profissionais para clínicas de estética, focadas em trazer mais agendamentos pelo Instagram e WhatsApp.\n\nPreparei um modelo específico para estética, só pra apresentar a ideia:\n👉 https://stetic.onrender.com/\n\nEsse tipo de página eu adapto com o nome da sua clínica, seus serviços, fotos e contatos.\nEstou com uma condição fixa de R$ 199, com entrega em até 72h.\n\nSe fizer sentido pra você, posso te explicar rapidinho como funcionaria pro seu caso.";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contactQueue, setContactQueue] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    status: "ALL",
    channel: "ALL",
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const debouncedSearch = useDebounce(filters.search, 350);
  const CONTACT_KEY = "maxconnect_contact_queue";

  useEffect(() => {
    const stored = localStorage.getItem(CONTACT_KEY);
    if (stored) {
      try {
        const parsed: number[] = JSON.parse(stored);
        setContactQueue(new Set(parsed));
      } catch {
        setContactQueue(new Set());
      }
    }
  }, []);

  const persistQueue = (queue: Set<number>) => {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(Array.from(queue)));
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.status !== "ALL") params.status = filters.status;
      if (filters.channel !== "ALL") params.channel = filters.channel;
      if (debouncedSearch) params.search = debouncedSearch;

      const { data } = await api.get<Lead[]>("/leads", { params });
      setLeads(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os leads agora.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.channel, filters.status]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const buildContactLink = (lead: Lead | (Partial<Lead> & { whatsapp?: string; instagram?: string })) => {
    const message = encodeURIComponent(FIRST_MESSAGE);
    const contact = lead.contact || "";

    const whatsappValue = "whatsapp" in lead ? lead.whatsapp : undefined;
    const instagramValue = "instagram" in lead ? lead.instagram : undefined;

    const phone = (whatsappValue || contact).startsWith("whatsapp:")
      ? (whatsappValue || contact).replace(/[^\d]/g, "")
      : whatsappValue?.replace(/[^\d]/g, "");

    if (phone) {
      return { url: `https://wa.me/${phone}?text=${message}`, label: "WhatsApp" };
    }

    const ig =
      (instagramValue || "").replace(/^@/, "") ||
      (contact.startsWith("instagram:") ? contact.split(":")[1]?.replace(/^@/, "") : "");

    if (ig) {
      return { url: `https://instagram.com/${ig}`, label: "Instagram" };
    }

    return null;
  };

  const handleQuickStart = () => {
    const nextLead = leads.find((lead) => contactQueue.has(lead.id) && buildContactLink(lead));
    if (!nextLead) {
      setError("Nenhum lead com contato válido para iniciar.");
      return;
    }
    const link = buildContactLink(nextLead);
    if (link) {
      window.open(link.url, "_blank");
    }
  };

  const handleSaveLead = async (payload: Partial<Lead> & { whatsapp?: string; instagram?: string; shouldContact?: boolean }) => {
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, payload);
        const updatedQueue = new Set(contactQueue);
        if (payload.shouldContact) {
          updatedQueue.add(editingLead.id);
        } else {
          updatedQueue.delete(editingLead.id);
        }
        setContactQueue(updatedQueue);
        persistQueue(updatedQueue);
      } else {
        const { data: newLead } = await api.post<Lead>("/leads", payload);

        const contactLink = buildContactLink({ ...payload, contact: newLead.contact });
        if (contactLink) {
          window.open(contactLink.url, "_blank");
        }

        if (payload.shouldContact && newLead.id) {
          const updatedQueue = new Set(contactQueue);
          updatedQueue.add(newLead.id);
          setContactQueue(updatedQueue);
          persistQueue(updatedQueue);
        }
      }
      await fetchLeads();
      setEditingLead(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar lead.");
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    const confirmed = window.confirm(`Deseja excluir ${lead.name}?`);
    if (!confirmed) return;
    try {
      await api.delete(`/leads/${lead.id}`);
      await fetchLeads();
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir lead.");
    }
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = leads.reduce<Record<LeadStatus, number>>(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      {
        MANDADO: 0,
        VISUALIZOU: 0,
        RESPONDEU: 0,
        NEGOCIANDO: 0,
        FECHADO: 0,
      }
    );

    return { total, byStatus };
  }, [leads]);

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <TopBar name={user?.name} email={user?.email} onLogout={logout} />

      <div className="relative max-w-6xl mx-auto px-4 pb-16 pt-8 space-y-8">
        <div className="rounded-3xl border border-slate-800/70 bg-max-surface/80 p-6 shadow-max-soft">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-max-orange to-max-orangeSoft shadow-max-glow flex items-center justify-center text-black">
              <Sparkles />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">MaxConnect</p>
              <h1 className="text-3xl font-semibold text-slate-50">Painel de prospecção</h1>
              <p className="text-slate-400 text-sm mt-1">Leads orgânicos, follow-up e conversão. by Maximos Code.</p>
            </div>
          </div>
        </div>

        <section className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leads totais" value={stats.total} icon={<Sparkles size={20} />} accent="orange" />
          <StatCard
            label="Respondeu"
            value={stats.byStatus.RESPONDEU}
            icon={<MessageCircle size={20} />}
            accent="green"
          />
          <StatCard
            label="Negociando"
            value={stats.byStatus.NEGOCIANDO}
            icon={<Handshake size={20} />}
            accent="blue"
          />
          <StatCard
            label="Fechados"
            value={stats.byStatus.FECHADO}
            icon={<CheckCircle2 size={20} />}
            accent="orange"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800/70 bg-max-surface2/80 px-5 py-4 shadow-max-soft space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, negócio ou contato"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full h-11 rounded-full border border-slate-700 bg-black/40 pl-11 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange"
              />
            </div>
            <button
              onClick={() => {
                setEditingLead(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-max-orange px-5 py-2.5 text-black font-semibold shadow-max-glow hover:brightness-110 transition"
              type="button"
            >
              <Plus size={18} />
              Novo lead
            </button>
            <button
              onClick={handleQuickStart}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-black/50 px-5 py-2.5 text-slate-200 hover:border-max-orange hover:text-max-orange transition"
              type="button"
            >
              Iniciar contatos (08h)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {channelOptions.map((option) => {
              const active = filters.channel === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilters((prev) => ({ ...prev, channel: option.value }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-max-orange bg-max-orange/15 text-max-orange"
                      : "border-slate-700 bg-black/40 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((option) => {
              const active = filters.status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilters((prev) => ({ ...prev, status: option.value }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-max-orange bg-max-orange/15 text-max-orange"
                      : "border-slate-700 bg-black/40 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-max-orange" size={28} />
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800/70 bg-max-surface/70 p-12 text-center">
            <p className="text-lg text-slate-50">Nenhum lead por aqui ainda.</p>
            <p className="text-slate-400 mt-2">Comece criando um lead e organize seu follow-up.</p>
            <button
              onClick={() => {
                setEditingLead(null);
                setModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-max-orange text-black px-5 py-3 font-semibold shadow-max-glow hover:brightness-110 transition"
            >
              <Plus size={18} />
              Criar lead
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={(selected) => {
                  setEditingLead(selected);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteLead}
                onContact={(selected) => {
                  const link = buildContactLink(selected);
                  if (link) {
                    window.open(link.url, "_blank");
                  } else {
                    setError("Este lead não possui WhatsApp ou Instagram para contato.");
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <LeadFormModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => {
          setModalOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
      />
    </div>
  );
};

export default DashboardPage;
