import { prisma } from "./prisma";
import { getAuthPayload } from "./auth";

export async function getCurrentUser() {
  const payload = await getAuthPayload();
  if (!payload?.userId || !payload.email) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
    return null;
  }

  return user;
}
