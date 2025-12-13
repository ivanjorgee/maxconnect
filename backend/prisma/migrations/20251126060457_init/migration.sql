-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('INSTAGRAM', 'WHATSAPP', 'OUTRO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('MANDADO', 'VISUALIZOU', 'RESPONDEU', 'NEGOCIANDO', 'FECHADO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "channel" "LeadChannel" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'MANDADO',
    "city" TEXT,
    "niche" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Lead_ownerId_status_idx" ON "Lead"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Lead_ownerId_channel_idx" ON "Lead"("ownerId", "channel");

-- CreateIndex
CREATE INDEX "Lead_ownerId_createdAt_idx" ON "Lead"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
