-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "proximaAcao" TEXT,
ADD COLUMN     "proximaAcaoData" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Empresa_statusFunil_idx" ON "Empresa"("statusFunil");

-- CreateIndex
CREATE INDEX "Empresa_proximaAcaoData_idx" ON "Empresa"("proximaAcaoData");
