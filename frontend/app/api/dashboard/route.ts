import { NextResponse } from "next/server";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard" }, { status: 500 });
  }
}
