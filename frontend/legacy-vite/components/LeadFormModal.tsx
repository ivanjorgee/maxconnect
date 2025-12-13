import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Lead, LeadChannel, LeadStatus } from "../types";
import { NotebookPen, PhoneCall } from "lucide-react";

const channelOptions: { value: LeadChannel; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OUTRO", label: "Outro" },
];

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "MANDADO", label: "Enviado" },
  { value: "VISUALIZOU", label: "Visualizou" },
  { value: "RESPONDEU", label: "Respondeu" },
  { value: "NEGOCIANDO", label: "Negociando" },
  { value: "FECHADO", label: "Fechado" },
];

type LeadPayload = Omit<Lead, "id" | "createdAt" | "updatedAt" | "ownerId">;

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    payload: Partial<LeadPayload> & {
      whatsapp?: string;
      instagram?: string;
      noContact?: boolean;
      shouldContact?: boolean;
    }
  ) => Promise<void> | void;
  lead?: Lead | null;
  initialShouldContact?: boolean;
}

const emptyForm: LeadPayload = {
  name: "",
  contact: "",
  channel: "INSTAGRAM",
  status: "MANDADO",
  city: "",
  niche: "",
  notes: "",
  address: "",
  mapUrl: "",
  website: "",
  rating: undefined,
  reviews: undefined,
};

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  open,
  onClose,
  onSave,
  lead,
  initialShouldContact = true,
}) => {
  const [form, setForm] = useState<LeadPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [noContact, setNoContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldContact, setShouldContact] = useState(initialShouldContact);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name,
        contact: lead.contact,
        channel: lead.channel,
        status: lead.status,
        city: lead.city || "",
        niche: lead.niche || "",
        notes: lead.notes || "",
        address: lead.address || "",
        mapUrl: lead.mapUrl || "",
        website: lead.website || "",
        rating: lead.rating || undefined,
        reviews: lead.reviews || undefined,
      });
      setWhatsapp("");
      setInstagram("");
      setNoContact(false);
      setShouldContact(initialShouldContact);
    } else {
      setForm(emptyForm);
      setWhatsapp("");
      setInstagram("");
      setNoContact(false);
      setShouldContact(initialShouldContact);
    }
  }, [lead, open, initialShouldContact]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sanitizedWhatsapp = whatsapp.replace(/[^\d]/g, "");
      const sanitizedInstagram = instagram.replace(/^@/, "").trim();
      const primaryContact =
        (sanitizedWhatsapp ? `whatsapp:+${sanitizedWhatsapp}` : "") ||
        (sanitizedInstagram ? `instagram:${sanitizedInstagram}` : "") ||
        form.contact;

      if (!primaryContact && !noContact) {
        setError("Informe WhatsApp ou @ do Instagram, ou marque que não encontrou contato.");
        setSaving(false);
        return;
      }

      await onSave({
        ...form,
        contact: primaryContact || form.contact || "Contato não encontrado",
        city: form.city?.trim() || undefined,
        niche: form.niche?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        address: form.address?.trim() || undefined,
        mapUrl: form.mapUrl?.trim() || undefined,
        website: form.website?.trim() || undefined,
        rating: form.rating,
        reviews: form.reviews,
        whatsapp: sanitizedWhatsapp ? `+${sanitizedWhatsapp}` : undefined,
        instagram: sanitizedInstagram || undefined,
        noContact,
        shouldContact,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-max-surface/95 border border-slate-800/80 shadow-max-soft">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/70">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lead</p>
            <h3 className="text-xl font-semibold text-slate-50">
              {lead ? "Editar lead" : "Novo lead"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-100 transition"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Nome / negócio</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="Clínica Aurora"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">WhatsApp</span>
              <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-slate-700 px-3">
                <div className="h-8 w-8 rounded-lg bg-max-orange/20 text-max-orange flex items-center justify-center">
                  <PhoneCall size={16} />
                </div>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-100 py-3"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Instagram (@)</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
                placeholder="@perfil"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 md:col-span-2">
            <input
              type="checkbox"
              checked={noContact}
              onChange={(e) => setNoContact(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-black/60 text-max-orange focus:ring-max-orange/50"
            />
            Não encontrei @ ou número do cliente
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 md:col-span-2">
            <input
              type="checkbox"
              checked={shouldContact}
              onChange={(e) => setShouldContact(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-black/60 text-max-orange focus:ring-max-orange/50"
            />
            Agendar contato às 08h (abrir conversa com mensagem pronta)
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Canal</span>
            <select
              value={form.channel}
              onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value as LeadChannel }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
            >
              {channelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as LeadStatus }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Cidade</span>
            <input
              value={form.city || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="São Paulo - SP"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Nicho</span>
            <input
              value={form.niche || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="Estética, infoprodutos..."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Endereço</span>
            <input
              value={form.address ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="Rua, número, bairro, cidade"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Link do Google Maps</span>
            <input
              value={form.mapUrl ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="https://maps.app.goo.gl/..."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Website</span>
            <input
              value={form.website ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
              placeholder="www.seusite.com"
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <NotebookPen size={16} />
              Observações / follow-ups
            </span>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40 resize-none"
              placeholder="Resumo da conversa, dores, oferta enviada..."
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Avaliação (0-5)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value ? Number(e.target.value) : undefined }))}
                className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
                placeholder="4.9"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Nº de avaliações</span>
              <input
                type="number"
                min="0"
                value={form.reviews ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, reviews: e.target.value ? Number(e.target.value) : undefined }))}
                className="rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/40"
                placeholder="117"
              />
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 md:col-span-2">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-max-orange/60 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-max-orange text-black font-semibold shadow-max-glow hover:brightness-110 transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : lead ? "Salvar alterações" : "Adicionar lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
