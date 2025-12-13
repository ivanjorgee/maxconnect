import { NextResponse } from "next/server";
import { scheduleFollowup1ForTodayLeads } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const result = await scheduleFollowup1ForTodayLeads();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scheduling follow-up 1", error);
    return NextResponse.json({ error: "Erro ao agendar follow-up 1" }, { status: 500 });
  }
}
