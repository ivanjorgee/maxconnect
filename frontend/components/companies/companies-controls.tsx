'use client';

import { useState } from "react";
import { Filter, Plus, Upload } from "lucide-react";
import { CompaniesFilters } from "./companies-filters";
import { CompanyForm } from "./company-form";
import { StatusFunil, OrigemLead, TipoSite } from "@prisma/client";
import { ImportModal } from "./import-modal";

type FiltersInitial = {
  q?: string;
  status?: StatusFunil | "";
  cidade?: string;
  origemLead?: OrigemLead | "";
  tipoSite?: TipoSite | "";
  temSite?: string;
  followup1Pending?: string;
  action?: string;
};

export function CompaniesControls({ initialFilters }: { initialFilters: FiltersInitial }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setFilterOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
      >
        <Filter size={16} />
        Filtros
      </button>
      <button
        type="button"
        onClick={() => setFormOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-background transition hover:bg-primary/90"
      >
        <Plus size={16} />
        Nova empresa
      </button>
      <button
        type="button"
        onClick={() => setImportOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary/70 hover:bg-primary/20"
      >
        <Upload size={16} />
        Importar lista
      </button>

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtros">
        <CompaniesFilters
          initial={initialFilters}
          onApplied={() => setFilterOpen(false)}
          onCleared={() => setFilterOpen(false)}
        />
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Cadastrar empresa">
        <CompanyForm onSaved={() => setFormOpen(false)} />
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Importar empresas">
        <ImportModal onImported={() => setImportOpen(false)} />
      </Modal>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-4">
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-stroke/70 bg-background p-4 shadow-2xl shadow-black/40 md:max-h-[80vh]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <button onClick={onClose} className="text-xs text-muted hover:text-foreground">
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar">{children}</div>
      </div>
    </div>
  );
}
