import { describe, expect, it } from "vitest";
import { Canal, OrigemLead } from "@prisma/client";
import { companyCreateSchema, loginSchema, macroSchema, profileUpdateSchema } from "./validation";

describe("validation schemas", () => {
  it("rejeita login com email invalido", () => {
    const result = loginSchema.safeParse({ email: "email-invalido", password: "senha" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha fraca na atualizacao de perfil", () => {
    const result = profileUpdateSchema.safeParse({
      email: "admin@maxconect.local",
      name: "Admin",
      currentPassword: "senha-atual",
      newPassword: "1234",
    });
    expect(result.success).toBe(false);
  });

  it("aceita criacao basica de empresa", () => {
    const result = companyCreateSchema.safeParse({
      nome: "Clinica Exemplo",
      endereco: "Rua A, 123",
      cidade: "Belem",
      linkGoogleMaps: "https://maps.example/123",
      canalPrincipal: Canal.WHATSAPP,
      origemLead: OrigemLead.GOOGLE_MAPS,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita macro desconhecida", () => {
    const result = macroSchema.safeParse({
      macro: "INVALIDA",
      canal: Canal.WHATSAPP,
      data: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
