import type { FormEvent } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, LogIn, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("ivanjfm01@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-10 top-20 h-64 w-64 rounded-full bg-max-orange/10 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-max-orangeSoft/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-max-surface to-max-surface2 border border-slate-800/70 shadow-max-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-max-orange to-max-orangeSoft shadow-max-glow flex items-center justify-center text-black">
                <Sparkles />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">MaxConnect</p>
                <h1 className="text-3xl font-semibold text-slate-50">Painel de prospecção e follow-up</h1>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6">
              CRM pessoal para prospecção orgânica. Centralize leads do Instagram, WhatsApp e qualquer outro canal,
              organize status, registre follow-ups e mantenha o ritmo de conversão.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-max-surface2/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-max-orange/20 flex items-center justify-center text-max-orange">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Acesso seguro</p>
                  <p className="font-medium text-slate-100">JWT + Auth</p>
                </div>
              </div>
              <div className="bg-max-surface2/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-max-orange/20 flex items-center justify-center text-max-orange">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Follow-up ágil</p>
                  <p className="font-medium text-slate-100">Status visuais</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 text-sm text-slate-400 flex items-center gap-2">
            <span className="text-slate-100 font-medium">by Maximos Code</span>
            <span className="h-1 w-1 rounded-full bg-max-orange" />
            <span>Fluxo em tempo real para equipes enxutas</span>
          </div>
        </div>

        <div className="p-8 lg:p-10 rounded-3xl bg-max-surface2/90 border border-slate-800/80 shadow-max-soft backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-max-orange/20 flex items-center justify-center text-max-orange">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Área segura</p>
              <h2 className="text-2xl font-semibold text-slate-50">Login no painel</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-400">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/50"
                placeholder="voce@maximoscode.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl bg-black/40 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-max-orange focus:ring-1 focus:ring-max-orange/50"
                placeholder="••••••••"
                required
              />
            </label>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-max-orange text-black font-medium py-3.5 shadow-max-glow transition hover:brightness-110 disabled:opacity-60"
            >
              <LogIn size={18} />
              {loading ? "Entrando..." : "Entrar no MaxConnect"}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-400">
            <p>
              Use o usuário seed: <span className="text-slate-100 font-medium">ivanjfm01@gmail.com</span>
            </p>
            <p>
              Senha: <span className="text-slate-100 font-medium">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
