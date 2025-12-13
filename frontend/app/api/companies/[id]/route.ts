import { NextResponse } from "next/server";
import { getEmpresaById, updateEmpresa } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const empresa = await getEmpresaById(params.id);
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error fetching empresa", error);
    return NextResponse.json({ error: "Erro ao buscar empresa" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const payload = await request.json();
    const empresa = await updateEmpresa(params.id, payload);
    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error updating empresa", error);
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    // Remove interações antes para evitar conflito de FK
    await prisma.interacao.deleteMany({ where: { empresaId: params.id } });
    await prisma.empresa.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting empresa", error);
    return NextResponse.json({ error: "Erro ao apagar empresa" }, { status: 500 });
  }
}
