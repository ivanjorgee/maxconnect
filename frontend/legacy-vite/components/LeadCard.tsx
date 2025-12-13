import { Edit2, Instagram, MapPin, MessageCircle, PhoneCall, Trash2 } from "lucide-react";
import type { Lead, LeadStatus } from "../types";

const statusLabels: Record<LeadStatus, string> = {
  MANDADO: "Enviado",
  VISUALIZOU: "Visualizou",
  RESPONDEU: "Respondeu",
  NEGOCIANDO: "Negociando",
  FECHADO: "Fechado",
};

const statusClasses: Record<LeadStatus, string> = {
  MANDADO: "bg-max-orange/15 text-max-orange border-max-orange/40",
  VISUALIZOU: "bg-blue-500/10 text-blue-200 border-blue-500/30",
  RESPONDEU: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  NEGOCIANDO: "bg-sky-500/10 text-sky-200 border-sky-500/30",
  FECHADO: "bg-max-orange/20 text-max-orange border-max-orange/60",
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onContact?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onDelete, onEdit, onContact }) => {
  const updatedAt = new Date(lead.updatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const channelIcon =
    lead.channel === "INSTAGRAM" ? <Instagram size={12} /> : lead.channel === "WHATSAPP" ? <PhoneCall size={12} /> : (
      <MessageCircle size={12} />
    );

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-max-surface/90 px-5 py-4 shadow-max-soft transition hover:border-max-orange/60 hover:shadow-max-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-max-orange to-max-orangeSoft shadow-max-glow flex items-center justify-center text-black text-sm font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-50 leading-tight">{lead.name}</p>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-slate-400">
                <MessageCircle size={12} className="text-max-orange" />
                {lead.contact}
              </span>
              {lead.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {lead.city}
                </span>
              )}
              {lead.niche && <span>{lead.niche}</span>}
            </p>
            {lead.address && <p className="text-xs text-slate-500 mt-1">{lead.address}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {lead.website && (
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-max-orange hover:underline"
                >
                  {lead.website}
                </a>
              )}
              {lead.mapUrl && (
                <a
                  href={lead.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-300 hover:text-max-orange"
                >
                  Google Maps
                </a>
              )}
              {lead.rating !== null && lead.rating !== undefined && (
                <span className="text-[11px] text-slate-300">
                  ⭐ {lead.rating} ({lead.reviews ?? 0})
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-black/40 px-3 py-1 text-[10px] text-slate-300">
                {channelIcon}
                {lead.channel}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-wide ${statusClasses[lead.status]}`}
              >
                {statusLabels[lead.status]}
              </span>
              <span className="rounded-full border border-slate-700 bg-black/40 px-3 py-1 text-[10px] text-slate-400">
                ID {lead.id}
              </span>
            </div>
            {lead.notes && (
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">{lead.notes}</p>
            )}
            <p className="mt-2 text-[10px] text-slate-500 uppercase">Atualizado em {updatedAt}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onContact && (
            <button
              onClick={() => onContact(lead)}
              className="h-8 w-8 rounded-full border border-slate-700 bg-black/60 text-slate-200 flex items-center justify-center hover:border-max-orange hover:text-max-orange transition"
              title="Entrar em contato"
              type="button"
            >
              <MessageCircle size={14} />
            </button>
          )}
          <button
            onClick={() => onEdit(lead)}
            className="h-8 w-8 rounded-full border border-slate-700 bg-black/60 text-slate-200 flex items-center justify-center hover:border-max-orange hover:text-max-orange transition"
            title="Editar"
            type="button"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(lead)}
            className="h-8 w-8 rounded-full border border-red-800 bg-black/60 text-red-400 flex items-center justify-center hover:border-red-500 transition"
            title="Excluir"
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
