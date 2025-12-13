import { redirect } from "next/navigation";
import { getAuthPayload } from "./auth";

export async function requirePageAuth(targetPath: string) {
  const session = await getAuthPayload();
  if (!session) {
    const redirectTo = encodeURIComponent(targetPath || "/");
    redirect(`/auth/login?redirect=${redirectTo}`);
  }
  return session;
}
