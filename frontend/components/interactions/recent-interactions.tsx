'use client';

import React from "react";
import Link from "next/link";
import { Canal, TipoInteracao } from "@prisma/client";
import { Mail, MessageCircle, Phone, Instagram } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { Select } from "../ui/select";

type Interaction = Prisma.InteracaoGetPayload<{ include: { empresa: true } }>;

type Props = {
  data: Interaction[];
};

export function RecentInteractions({ data }: Props) {
  const [filter, setFilter] = React.useState<"todos" | Canal>("todos");

  const filtered = data.filter((item) => (filter === "todos" ? true : item.canal === filter));

  return (
    <div className="card card-hover h-full">
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Interações recentes</p>
          <p className="text-xs text-muted">Últimos contatos registrados</p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Canal | "todos")}
          className="w-40 border-stroke/60 bg-background-elevated text-sm"
        >
          <option value="todos">Todos</option>
          <option value={Canal.WHATSAPP}>WhatsApp</option>
          <option value={Canal.INSTAGRAM_DM}>Instagram</option>
          <option value={Canal.LIGACAO}>Reuniões/Ligações</option>
        </Select>
      </div>
      <div className="divide-y divide-stroke/70">
        {filtered.length ? (
          filtered.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <ChannelIcon canal={item.canal} />
                <div>
                  <Link href={`/empresas/${item.empresa?.id}`} className="text-sm font-semibold text-foreground hover:underline">
                    {item.empresa?.nome ?? "—"}
                  </Link>
                  <p className="text-xs text-muted">
                    {mapInteracaoTipo(item.tipo)} • {item.descricao.slice(0, 60)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted">{formatRelative(item.data ?? item.createdAt)}</span>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted">Nenhuma interação registrada.</p>
        )}
      </div>
    </div>
  );
}

function ChannelIcon({ canal }: { canal: Canal }) {
  const base = "h-5 w-5";
  if (canal === Canal.WHATSAPP) return <MessageCircle className={`${base} text-primary`} />;
  if (canal === Canal.INSTAGRAM_DM) return <Instagram className={`${base} text-primary`} />;
  if (canal === Canal.EMAIL) return <Mail className={`${base} text-primary`} />;
  return <Phone className={`${base} text-primary`} />;
}

function mapInteracaoTipo(tipo: TipoInteracao) {
  const map: Record<TipoInteracao, string> = {
    MENSAGEM_1: "Mensagem M1",
    FOLLOWUP_1: "Follow-up 1",
    FOLLOWUP_2: "Follow-up 2",
    MENSAGEM_WHATSAPP: "Mensagem WhatsApp",
    MENSAGEM_INSTAGRAM: "Mensagem Instagram",
    LIGACAO: "Ligação",
    REUNIAO: "Reunião",
    OUTRO: "Outro",
  };
  return map[tipo];
}
