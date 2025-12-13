import { ReactNode } from "react";
import {
  Activity,
  Link as LinkIcon,
  MapPin,
  Phone,
  User,
  Globe,
  MessageCircle,
  Instagram,
  PhoneCall,
  Mail,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/leads/activity-form";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { canalLabels, interacaoLabels, origemLabels, statusLabels, tipoSiteLabels } from "@/lib/dictionaries";
import { getEmpresaById } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/utils";
import { CompanyEditModal } from "@/components/companies/company-edit-modal";
import { requirePageAuth } from "@/lib/requirePageAuth";

type Params = {
  params: { id: string };
};

export default async function LeadDetailPage({ params }: Params) {
  await requirePageAuth(`/leads/${params.id}`);
  const empresa = await getEmpresaById(params.id);
  if (!empresa) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={empresa.nome}
        subtitle={`${origemLabels[empresa.origemLead]} • ${canalLabels[empresa.canalPrincipal]}`}
        actions={
          <div className="flex items-center gap-2">
            <LeadStatusBadge status={empresa.statusFunil} />
            <CompanyEditModal company={empresa} />
          </div>
        }
      />

      <div className="card card-hover space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Resumo</p>
            <p className="text-xs text-muted">{statusLabels[empresa.statusFunil]}</p>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            Modelo {empresa.modeloAbertura ?? "—"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow icon={<User size={14} />} label="Especialidade" value={empresa.especialidadePrincipal ?? "—"} />
          <InfoRow icon={<MapPin size={14} />} label="Cidade" value={empresa.cidade} />
          <InfoRow
            icon={<LinkIcon size={14} />}
            label="Google Maps"
            value={
              empresa.linkGoogleMaps ? (
                <a href={empresa.linkGoogleMaps} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Abrir mapa
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Instagram size={14} />}
            label="Instagram"
            value={
              empresa.instagram ? (
                <a href={normalizeUrl(empresa.instagram)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Abrir Instagram
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Globe size={14} />}
            label="Site"
            value={
              empresa.temSite && empresa.website ? (
                <a href={empresa.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {empresa.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                tipoSiteLabels[empresa.tipoSite]
              )
            }
          />
          <InfoRow
            icon={<Phone size={14} />}
            label="Telefone"
            value={empresa.telefonePrincipal ?? empresa.whatsapp ?? "—"}
            action={
              empresa.whatsapp ? (
                <a
                  href={`https://wa.me/${sanitizePhone(empresa.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-primary/40 px-2 py-1 text-xs text-primary transition hover:bg-primary/10"
                >
                  Abrir WhatsApp
                </a>
              ) : null
            }
          />
          <InfoRow icon={<Activity size={14} />} label="Canal" value={`${canalLabels[empresa.canalPrincipal]} • ${origemLabels[empresa.origemLead]}`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Timeline interacoes={empresa.interacoes} />

        <ActivityForm empresa={empresa} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, action }: { icon: ReactNode; label: string; value: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
      {action ? <div className="flex items-center">{action}</div> : null}
    </div>
  );
}

function Timeline({ interacoes }: { interacoes: Awaited<ReturnType<typeof getEmpresaById>>["interacoes"] }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Linha do tempo</p>
          <p className="text-xs text-muted">Interações com a empresa</p>
        </div>
      </div>

      <div className="thin-scrollbar flex max-h-[420px] flex-col gap-3 overflow-y-auto">
        {interacoes.length ? (
          interacoes.map((interacao) => (
            <div key={interacao.id} className="flex gap-3 rounded-lg border border-stroke/60 bg-background-elevated p-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ChannelIcon canal={interacao.canal} />
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{interacaoLabels[interacao.tipo]}</span>
                  </div>
                  <span className="text-xs text-muted">{formatDate(interacao.data)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatRelative(interacao.data)}</p>
                <p className="text-sm text-muted">{interacao.descricao}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Sem interações ainda.</p>
        )}
      </div>
    </div>
  );
}

function ChannelIcon({ canal }: { canal: string }) {
  if (canal === "WHATSAPP") return <MessageCircle size={16} className="text-green-400" />;
  if (canal === "INSTAGRAM_DM") return <Instagram size={16} className="text-pink-400" />;
  if (canal === "LIGACAO") return <PhoneCall size={16} className="text-amber-300" />;
  if (canal === "EMAIL") return <Mail size={16} className="text-blue-300" />;
  return <Activity size={16} className="text-primary" />;
}

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}
