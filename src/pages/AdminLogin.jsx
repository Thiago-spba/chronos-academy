import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, GraduationCap, AlertCircle } from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/admin/painel");
    } catch (error) {
      console.error(error);
      setErro("Acesso negado. E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-100/20 dark:bg-indigo-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl shadow-stone-200/50 dark:shadow-indigo-900/20 p-8 sm:p-10 transition-colors duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 dark:bg-indigo-600 flex items-center justify-center shadow-lg shadow-amber-600/25 dark:shadow-indigo-600/30 mb-4 transition-colors duration-500">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-stone-800 dark:text-slate-100 tracking-tight transition-colors duration-500">
              Área Administrativa
            </h1>
            <p className="text-sm text-stone-500 dark:text-slate-400 mt-1 transition-colors duration-500">
              Acesso seguro criptografado
            </p>
          </div>

          {erro && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-500">
                E-mail
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail cadastrado" className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-100 text-sm placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-indigo-500/50 transition-all duration-500" autoComplete="email" />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-500">
                Senha
              </label>
              <div className="relative">
                <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 pr-12 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-100 text-sm placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-indigo-500/50 transition-all duration-500" autoComplete="current-password" />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 dark:text-slate-500 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors duration-300">
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={carregando} className="w-full py-3.5 rounded-xl bg-amber-600 dark:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-amber-600/25 dark:shadow-indigo-600/30 hover:bg-amber-700 dark:hover:bg-indigo-700 disabled:opacity-60 transition-all duration-500 flex items-center justify-center gap-2">
              {carregando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Autenticar"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-indigo-400 transition-colors duration-500">
            <GraduationCap className="w-3.5 h-3.5" />
            Voltar para o site público
          </a>
        </div>
      </div>
    </div>
  );
}
