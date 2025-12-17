import { NextResponse } from "next/server";
import { getEmpresaById, updateEmpresa } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyIdSchema, companyUpdateSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
      );
    }

    const empresa = await getEmpresaById(idParsed.data);
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    return NextResponse.json(empresa);
  } catch (error) {
    logger.error("Error fetching empresa", { error });
    return NextResponse.json({ error: "Erro ao buscar empresa" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = companyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    if (!Object.keys(parsed.data).length) {
      return NextResponse.json({ error: "Nenhuma alteracao enviada." }, { status: 400 });
    }

    const empresa = await updateEmpresa(idParsed.data, parsed.data);
    return NextResponse.json(empresa);
  } catch (error) {
    logger.error("Error updating empresa", { error });
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
      );
    }

    // Remove interações antes para evitar conflito de FK
    await prisma.interacao.deleteMany({ where: { empresaId: idParsed.data } });
    await prisma.empresa.delete({ where: { id: idParsed.data } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error deleting empresa", { error });
    return NextResponse.json({ error: "Erro ao apagar empresa" }, { status: 500 });
  }
}
