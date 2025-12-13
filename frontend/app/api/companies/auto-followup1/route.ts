import { NextResponse } from "next/server";
import { autoScheduleFollowup1After24h } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const result = await autoScheduleFollowup1After24h();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error auto scheduling follow-up 1", error);
    return NextResponse.json({ error: "Erro ao agendar follow-up 1 automático" }, { status: 500 });
  }
}
