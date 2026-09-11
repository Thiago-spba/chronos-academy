import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, GraduationCap, AlertCircle } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

const ADMIN_EMAIL = "thiago.rpba@gmail.com"; // único e-mail com acesso ao painel

export default function AdminLogin() {
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    setErro("");
    setCarregando(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        setErro("Esta conta Google não tem acesso à área administrativa.");
        return;
      }
      navigate("/admin/painel");
    } catch (error) {
      console.error(error);
      setErro("Falha ao autenticar com o Google. Tente novamente.");
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
              Acesso restrito ao professor
            </p>
          </div>

          {erro && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-100 font-bold text-sm shadow-sm hover:bg-stone-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-all duration-300"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>
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
