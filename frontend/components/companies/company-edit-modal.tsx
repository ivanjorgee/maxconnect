'use client';

import { useState, useTransition, FormEvent } from "react";
import { Canal, OrigemLead, TipoSite } from "@prisma/client";
import { useRouter } from "next/navigation";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CADENCE_TEMPLATES, resolveM1TemplateId } from "@/lib/cadence";

type Props = {
  company: EmpresaWithInteracoes;
  onSaved?: () => void;
};

const cidadeOptions = [
  { label: "Belém, PA", value: "Belém,PA" },
  { label: "Ananindeua, PA", value: "Ananindeua,PA" },
  { label: "Santarém, PA", value: "Santarém,PA" },
];

const templateOptions = [
  { label: CADENCE_TEMPLATES.M1A.title, value: "M1A" },
  { label: CADENCE_TEMPLATES.M1B.title, value: "M1B" },
] as const;

type TemplateInicial = (typeof templateOptions)[number]["value"];

export function CompanyEditModal({ company, onSaved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [nome, setNome] = useState(company.nome);
  const [especialidadePrincipal, setEspecialidadePrincipal] = useState(company.especialidadePrincipal ?? "");
  const [cidade, setCidade] = useState(company.cidade || cidadeOptions[0].value);
  const [origemLead, setOrigemLead] = useState<OrigemLead>(company.origemLead);
  const [endereco, setEndereco] = useState(company.endereco ?? "");
  const [linkGoogleMaps, setLinkGoogleMaps] = useState(company.linkGoogleMaps ?? "");
  const [telefoneUnico, setTelefoneUnico] = useState(company.whatsapp || company.telefonePrincipal || "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [instagram, setInstagram] = useState(company.instagram ?? "");
  const [temSite, setTemSite] = useState<boolean>(company.temSite ?? false);
  const [tipoSite, setTipoSite] = useState<TipoSite>(company.tipoSite ?? TipoSite.NENHUM);
  const [canalPrincipal, setCanalPrincipal] = useState<Canal>(company.canalPrincipal);
  const [tags, setTags] = useState(company.tags?.join(", ") ?? "");
  const [observacoes, setObservacoes] = useState(company.observacoes ?? "");
  const [currentTemplate, setCurrentTemplate] = useState<TemplateInicial>(
    resolveM1TemplateId(company.currentTemplate, company.id),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      nome,
      endereco,
      cidade,
      linkGoogleMaps,
      telefonePrincipal: telefoneUnico || null,
      whatsapp: telefoneUnico || null,
      website: website || null,
      instagram: instagram || null,
      temSite,
      tipoSite,
      origemLead,
      canalPrincipal,
      especialidadePrincipal: especialidadePrincipal || null,
      tags: parsedTags,
      observacoes: observacoes || null,
      currentTemplate,
    };

    const response = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage("Não foi possível salvar as alterações.");
      return;
    }

    startTransition(() => {
      router.refresh();
      onSaved?.();
      setOpen(false);
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm("Deseja apagar esta empresa e suas interações?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("Não foi possível apagar a empresa.");
        setDeleting(false);
        return;
      }
      startTransition(() => {
        router.push("/empresas");
      });
    } catch {
      setMessage("Erro ao apagar empresa.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-primary/60 bg-primary px-3 py-2 text-sm font-semibold text-background shadow-glow-primary transition hover:bg-primary/90"
      >
        Editar empresa
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-4xl">
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              {message ? <span className="text-xs text-muted">{message}</span> : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-stroke/60 bg-background-elevated px-2 py-1 text-xs text-muted hover:text-foreground"
              >
                Fechar
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="max-h-[90vh] overflow-y-auto rounded-2xl border border-stroke/70 bg-background p-4 shadow-2xl shadow-black/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Editar empresa</p>
                  <p className="text-xs text-muted">Ajuste os dados básicos cadastrados.</p>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Nome" required>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Clínica Exemplo" required />
                </Field>
                <Field label="Especialidade principal">
                  <Input
                    value={especialidadePrincipal ?? ""}
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
                <Field label="Template inicial (A/B)">
                  <Select value={currentTemplate} onChange={(e) => setCurrentTemplate(e.target.value as TemplateInicial)}>
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <span />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Endereço" required>
                  <Input value={endereco ?? ""} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número" required />
                </Field>
                <Field label="Link do Google Maps" required>
                  <Input value={linkGoogleMaps ?? ""} onChange={(e) => setLinkGoogleMaps(e.target.value)} placeholder="https://maps.google..." required />
                </Field>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Field label="WhatsApp / telefone principal">
                  <Input value={telefoneUnico ?? ""} onChange={(e) => setTelefoneUnico(e.target.value)} placeholder="+55 11 99999-9999" />
                </Field>
                <Field label="Website">
                  <Input value={website ?? ""} onChange={(e) => setWebsite(e.target.value)} placeholder="www.seusite.com" />
                </Field>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Instagram">
                  <Input value={instagram ?? ""} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
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
                </div>
              </div>

              <Field label="Tags (separadas por vírgula)">
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="mapas, premium, sem-site" />
              </Field>

              <Field label="Observações">
                <Textarea
                  value={observacoes ?? ""}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Contexto, próximos passos, objeções."
                  rows={3}
                />
              </Field>

              <div className="flex items-center justify-between pt-2">
                {message ? <p className="text-xs text-muted">{message}</p> : <span />}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-900/60 text-red-50 hover:bg-red-900"
                  >
                    {deleting ? "Apagando..." : "Apagar"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="border border-stroke/70">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
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
