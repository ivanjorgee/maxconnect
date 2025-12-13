-- CreateEnum
CREATE TYPE "StatusFunil" AS ENUM ('NOVO', 'MENSAGEM_1_ENVIADA', 'RESPONDEU', 'EM_CONVERSA', 'REUNIAO_AGENDADA', 'REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'FECHADO', 'PERDIDO', 'FOLLOWUP_LONGO');

-- CreateEnum
CREATE TYPE "TipoSite" AS ENUM ('NENHUM', 'FRACO', 'RAZOAVEL', 'BOM');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('GOOGLE_MAPS', 'INSTAGRAM', 'INDICACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('WHATSAPP', 'INSTAGRAM_DM', 'LIGACAO', 'EMAIL');

-- CreateEnum
CREATE TYPE "TicketMedioEstimado" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "ModeloAbertura" AS ENUM ('M1', 'M2', 'M3', 'M4', 'M5');

-- CreateEnum
CREATE TYPE "TipoInteracao" AS ENUM ('MENSAGEM_1', 'FOLLOWUP_1', 'FOLLOWUP_2', 'MENSAGEM_WHATSAPP', 'MENSAGEM_INSTAGRAM', 'LIGACAO', 'REUNIAO', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "telefonePrincipal" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "avaliacaoGoogle" DOUBLE PRECISION,
    "qtdAvaliacoes" INTEGER,
    "linkGoogleMaps" TEXT NOT NULL,
    "temSite" BOOLEAN NOT NULL DEFAULT false,
    "tipoSite" "TipoSite" NOT NULL DEFAULT 'NENHUM',
    "origemLead" "OrigemLead" NOT NULL,
    "canalPrincipal" "Canal" NOT NULL,
    "especialidadePrincipal" TEXT,
    "ticketMedioEstimado" "TicketMedioEstimado",
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "statusFunil" "StatusFunil" NOT NULL DEFAULT 'NOVO',
    "modeloAbertura" "ModeloAbertura",
    "dataMensagem1" TIMESTAMP(3),
    "dataFollowup1" TIMESTAMP(3),
    "dataFollowup2" TIMESTAMP(3),
    "dataReuniao" TIMESTAMP(3),
    "dataFechamento" TIMESTAMP(3),
    "tags" TEXT[],
    "observacoes" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoInteracao" NOT NULL,
    "canal" "Canal" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
