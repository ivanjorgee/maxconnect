import { NextResponse } from "next/server";
import { registerFollowupConversa } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
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

    const result = await registerFollowupConversa(idParsed.data);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error registering follow-up conversa", { error });
    return NextResponse.json({ error: "Erro ao registrar follow-up de conversa" }, { status: 500 });
  }
}
