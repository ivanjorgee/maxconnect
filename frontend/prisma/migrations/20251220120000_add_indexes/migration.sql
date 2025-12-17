-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_cidade_idx" ON "Empresa"("cidade");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_canalPrincipal_idx" ON "Empresa"("canalPrincipal");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_origemLead_idx" ON "Empresa"("origemLead");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_tipoSite_idx" ON "Empresa"("tipoSite");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_temSite_idx" ON "Empresa"("temSite");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_proximaAcao_idx" ON "Empresa"("proximaAcao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Empresa_statusFunil_proximaAcaoData_idx" ON "Empresa"("statusFunil", "proximaAcaoData");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Interacao_empresaId_data_idx" ON "Interacao"("empresaId", "data");
