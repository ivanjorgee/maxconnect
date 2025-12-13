import { LogOut } from "lucide-react";

interface TopBarProps {
  name?: string;
  email?: string;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ name = "Usuário", email = "", onLogout }) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-max-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-max-orange to-max-orangeSoft shadow-max-glow flex items-center justify-center text-black font-semibold">
            M
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">MaxConnect</p>
            <p className="text-xs text-slate-300">
              by <span className="font-medium text-slate-100">Maximos Code</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm text-slate-100 font-medium">{name}</p>
            <p className="text-[12px] text-slate-400">{email}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-max-surface2 border border-slate-700 flex items-center justify-center text-slate-200 text-sm font-semibold">
            {initials || "MC"}
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-max-surface px-3 py-2 text-slate-300 hover:text-max-orange hover:border-max-orange transition"
            type="button"
          >
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
