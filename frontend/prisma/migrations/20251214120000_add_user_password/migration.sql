-- Add password hash to users for login (idempotent for existing databases)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
