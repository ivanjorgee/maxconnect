-- AlterEnum
ALTER TYPE "StatusFunil" ADD VALUE IF NOT EXISTS 'OBJ_CONFIANCA';
ALTER TYPE "StatusFunil" ADD VALUE IF NOT EXISTS 'GATEKEEPER';
ALTER TYPE "StatusFunil" ADD VALUE IF NOT EXISTS 'PREVIEW_ENVIADO';
ALTER TYPE "StatusFunil" ADD VALUE IF NOT EXISTS 'SEM_RESPOSTA_30D';
ALTER TYPE "StatusFunil" ADD VALUE IF NOT EXISTS 'NURTURE';

-- AlterEnum
ALTER TYPE "TipoInteracao" ADD VALUE IF NOT EXISTS 'BREAKUP';

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "InteracaoDirection" AS ENUM ('OUTBOUND', 'INBOUND');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "InteracaoOutcome" AS ENUM ('NEUTRO', 'RESPONDEU', 'PEDIU_PRECO', 'OBJ_CONFIANCA', 'GATEKEEPER', 'PREVIEW_ENVIADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Empresa" ADD COLUMN "lastOutboundAt" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "lastInboundAt" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "noResponseUntil" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "currentTemplate" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "currentCadenceStep" TEXT;

-- AlterTable
ALTER TABLE "Interacao" ADD COLUMN "direction" "InteracaoDirection";
ALTER TABLE "Interacao" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Interacao" ADD COLUMN "outcome" "InteracaoOutcome";
