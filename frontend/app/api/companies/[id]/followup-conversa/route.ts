import { NextResponse } from "next/server";
import { registerFollowupConversa } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const result = await registerFollowupConversa(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error registering follow-up conversa", error);
    return NextResponse.json({ error: "Erro ao registrar follow-up de conversa" }, { status: 500 });
  }
}
