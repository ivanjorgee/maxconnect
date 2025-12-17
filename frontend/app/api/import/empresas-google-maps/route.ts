import { Canal, ModeloAbertura, OrigemLead, StatusFunil } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { formatZodError, importEmpresasSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

const modelos: ModeloAbertura[] = ["M1", "M2", "M3", "M4", "M5"];

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json().catch(() => null);
    const parsed = importEmpresasSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }
    const text = parsed.data.text;

    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let contextoCidade = "Cidade não informada";

    const registros: Array<{
      nome: string;
      endereco: string;
      telefonePrincipal?: string | null;
      cidade: string;
      modeloAbertura: ModeloAbertura;
    }> = [];

    for (const line of lines) {
      // Linha de cidade: sem dígitos e curta
      if (!/[0-9]/.test(line) && line.length <= 40) {
        contextoCidade = capitalize(line);
        continue;
      }

      const parsed = parseEmpresa(line, contextoCidade);
      if (parsed) registros.push(parsed);
    }

    if (!registros.length) {
      return NextResponse.json({ error: "Nenhuma empresa identificada nas linhas enviadas." }, { status: 400 });
    }

    const created: string[] = [];
    for (const reg of registros) {
      const modeloSorteado = modelos[Math.floor(Math.random() * modelos.length)];
      const telefone = reg.telefonePrincipal ?? "";
      await prisma.empresa.create({
        data: {
          nome: reg.nome,
          endereco: reg.endereco,
          cidade: reg.cidade,
          telefonePrincipal: telefone || null,
          whatsapp: telefone || null,
          canalPrincipal: Canal.WHATSAPP,
          origemLead: OrigemLead.GOOGLE_MAPS,
          statusFunil: StatusFunil.NOVO,
          modeloAbertura: modeloSorteado,
          proximaAcao: "MENSAGEM_1",
          proximaAcaoData: new Date(), // igual ao cadastro manual: cria a ação pendente com data atual
          linkGoogleMaps: "",
        },
      });
      created.push(reg.nome);
    }

    return NextResponse.json({ imported: created.length, empresas: created.slice(0, 50) });
  } catch (error) {
    logger.error("Erro ao importar empresas do Google Maps", { error });
    return NextResponse.json({ error: "Erro ao importar empresas" }, { status: 500 });
  }
}

function parseEmpresa(line: string, cidade: string) {
  const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;

  const nome = parts[0];
  const telefone = parts.find((p) => /\d{4,}/.test(p)) ?? null;
  const endereco = parts.slice(1, parts.length - (telefone ? 1 : 0)).join(", ") || "Endereço não informado";

  return {
    nome,
    endereco,
    telefonePrincipal: telefone,
    cidade: capitalize(cidade),
    modeloAbertura: modelos[Math.floor(Math.random() * modelos.length)],
  };
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
