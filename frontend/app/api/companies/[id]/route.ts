import { getEmpresaById, updateEmpresa } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyIdSchema, companyUpdateSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return respondJson(
        apiLogger,
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    const empresa = await getEmpresaById(idParsed.data);
    if (!empresa) {
      return respondJson(apiLogger, { error: "Empresa não encontrada" }, { status: 404 }, { userId: auth.userId });
    }
    return respondJson(apiLogger, empresa, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error fetching empresa", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao buscar empresa" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return respondJson(
        apiLogger,
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = companyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return respondJson(
        apiLogger,
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    if (!Object.keys(parsed.data).length) {
      return respondJson(apiLogger, { error: "Nenhuma alteracao enviada." }, { status: 400 }, { userId: auth.userId });
    }

    const empresa = await updateEmpresa(idParsed.data, parsed.data);
    return respondJson(apiLogger, empresa, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error updating empresa", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return respondJson(
        apiLogger,
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    // Remove interações antes para evitar conflito de FK
    await prisma.interacao.deleteMany({ where: { empresaId: idParsed.data } });
    await prisma.empresa.delete({ where: { id: idParsed.data } });
    return respondJson(apiLogger, { ok: true }, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error deleting empresa", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao apagar empresa" }, { status: 500 });
  }
}
