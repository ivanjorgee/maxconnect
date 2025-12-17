export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelative(value?: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = date.getTime() - Date.now();
  const absolute = Math.abs(diff);
  const minutes = Math.round(absolute / (1000 * 60));
  const hours = Math.round(absolute / (1000 * 60 * 60));
  const days = Math.round(absolute / (1000 * 60 * 60 * 24));

  if (minutes < 60) return diff >= 0 ? `em ${minutes} min` : `${minutes} min atrás`;
  if (hours < 48) return diff >= 0 ? `em ${hours}h` : `${hours}h atrás`;
  return diff >= 0 ? `em ${days} dias` : `${days} dias atrás`;
}

export function isToday(value?: Date | string | null): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isPast(value?: Date | string | null): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  return date.getTime() < Date.now();
}

export function isWithinDays(value: Date | string | null | undefined, days: number): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}
