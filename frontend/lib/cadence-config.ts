import { env } from "./env";

const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_NO_RESPONSE_DAYS = 30;

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getCadenceConfig() {
  const maxAttempts = parsePositiveInt(env.CADENCE_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
  const noResponseDays = parsePositiveInt(env.CADENCE_NO_RESPONSE_DAYS, DEFAULT_NO_RESPONSE_DAYS);
  return { maxAttempts, noResponseDays };
}
