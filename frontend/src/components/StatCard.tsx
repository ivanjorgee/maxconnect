import type { ReactNode } from "react";

type Accent = "orange" | "green" | "blue";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: Accent;
}

const accentClasses: Record<Accent, string> = {
  orange: "from-max-orange/80 to-max-orangeSoft/10",
  green: "from-emerald-400/50 to-emerald-500/10",
  blue: "from-sky-400/60 to-sky-500/10",
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent = "orange" }) => {
  const gradient = accentClasses[accent] || accentClasses.orange;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-max-surface to-max-surface2 p-4 shadow-max-soft flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-slate-50 mt-2">{value}</p>
      </div>
      <div
        className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-max-glow text-black`}
      >
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
