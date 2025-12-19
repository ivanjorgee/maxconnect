'use client';

import { FormEvent, useState, useTransition } from "react";
import { Canal, OrigemLead, StatusFunil, TipoSite, ModeloAbertura } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { modelosAbertura } from "@/lib/modelosAbertura";

const cidadeOptions = [
  { label: "Belém, PA", value: "Belém,PA" },
  { label: "Ananindeua, PA", value: "Ananindeua,PA" },
  { label: "Santarém, PA", value: "Santarém,PA" },
];

type Props = {
  onSaved?: () => void;
};

export function CompanyForm({ onSaved }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState(cidadeOptions[0].value);
  const [linkGoogleMaps, setLinkGoogleMaps] = useState("");
  const [telefoneUnico, setTelefoneUnico] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [temSite, setTemSite] = useState(false);
  const [tipoSite, setTipoSite] = useState<TipoSite>(TipoSite.NENHUM);
  const [origemLead, setOrigemLead] = useState<OrigemLead>(OrigemLead.GOOGLE_MAPS);
  const [canalPrincipal, setCanalPrincipal] = useState<Canal>(Canal.WHATSAPP);
  const [especialidadePrincipal, setEspecialidadePrincipal] = useState("");
  const [tags, setTags] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [modeloAbertura, setModeloAbertura] = useState<ModeloAbertura | "">(modelosAbertura[0].codigo);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        endereco,
        cidade,
        linkGoogleMaps,
        telefonePrincipal: telefoneUnico,
        whatsapp: telefoneUnico,
        website,
        instagram,
        temSite,
        tipoSite,
        origemLead,
        canalPrincipal,
        especialidadePrincipal,
        statusFunil: StatusFunil.NOVO,
        ticketMedioEstimado: undefined,
        prioridade: undefined,
        modeloAbertura: modeloAbertura || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        observacoes,
        proximaAcao: "FAZER_PRIMEIRO_CONTATO",
        proximaAcaoData: new Date(),
      }),
    });

    if (!response.ok) {
      setMessage("Não foi possível salvar a empresa.");
      return;
    }

    setMessage("Empresa criada.");
    setNome("");
    setEndereco("");
    setCidade(cidadeOptions[0].value);
    setLinkGoogleMaps("");
    setTelefoneUnico("");
    setWebsite("");
    setInstagram("");
    setTemSite(false);
    setTipoSite(TipoSite.NENHUM);
    setOrigemLead(OrigemLead.GOOGLE_MAPS);
    setCanalPrincipal(Canal.WHATSAPP);
    setEspecialidadePrincipal("");
    setModeloAbertura(modelosAbertura[0].codigo);
    setTags("");
    setObservacoes("");
    startTransition(() => router.refresh());
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="card card-hover space-y-3 p-3 sm:p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Cadastrar empresa</p>
        <p className="text-xs text-muted">Campos essenciais para rastrear canal, status e site.</p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Nome" required>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Clínica Exemplo" required />
        </Field>
        <Field label="Especialidade principal">
          <Input
            value={especialidadePrincipal}
            onChange={(e) => setEspecialidadePrincipal(e.target.value)}
            placeholder="Harmonização, depilação a laser..."
          />
        </Field>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Cidade" required>
          <Select value={cidade} onChange={(e) => setCidade(e.target.value)}>
            {cidadeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Origem do lead" required>
          <Select value={origemLead} onChange={(e) => setOrigemLead(e.target.value as OrigemLead)}>
            {Object.values(OrigemLead).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Endereço" required>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número" required />
        </Field>
        <Field label="Link do Google Maps" required>
          <Input value={linkGoogleMaps} onChange={(e) => setLinkGoogleMaps(e.target.value)} placeholder="https://maps.google..." required />
        </Field>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="WhatsApp / telefone principal">
          <Input value={telefoneUnico} onChange={(e) => setTelefoneUnico(e.target.value)} placeholder="+55 11 99999-9999" />
        </Field>
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.seusite.com" />
        </Field>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Instagram">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
        </Field>
        <span />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Canal principal" required>
          <Select value={canalPrincipal} onChange={(e) => setCanalPrincipal(e.target.value as Canal)}>
            {Object.values(Canal).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Tem site?">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={temSite}
                onChange={(e) => setTemSite(e.target.checked)}
                className="h-4 w-4 rounded border-stroke/70 bg-background-elevated"
              />
              <span className="text-sm text-muted">Sim</span>
            </div>
          </Field>
          <Field label="Tipo de site">
            <Select value={tipoSite} onChange={(e) => setTipoSite(e.target.value as TipoSite)}>
              {Object.values(TipoSite).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Modelo de abertura">
            <Select value={modeloAbertura} onChange={(e) => setModeloAbertura(e.target.value as ModeloAbertura)}>
              {modelosAbertura.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo} — {m.titulo}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <Field label="Tags (separadas por vírgula)">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="mapas, premium, sem-site" />
      </Field>

      <Field label="Observações">
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Contexto, necessidades, próximos passos."
          rows={3}
        />
      </Field>

      <div className="flex items-center justify-between">
        {message ? <p className="text-xs text-muted">{message}</p> : <span />}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar empresa"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted">
        {label} {required ? "*" : ""}
      </label>
      {children}
    </div>
  );
}
