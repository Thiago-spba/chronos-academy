import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// Avisos do site: sempre centralizados na tela, com a mesma cara (cantos
// arredondados, sombra, entrada suave) para nao ficar cada um de um jeito.

// Confirmacao rapida (ex.: "Aula gravada com sucesso!"). Some sozinho.
export function Toast({ mensagem, erro, duracao, onClose }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const entrar = setTimeout(() => setVisivel(true), 10);
    const t = setTimeout(onClose, duracao ?? (erro ? 6000 : 3000));
    return () => { clearTimeout(entrar); clearTimeout(t); };
  }, [onClose, erro, duracao]);

  return (
    <div className="fixed top-4 inset-x-0 sm:top-6 z-[100] flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto flex items-center gap-2.5 max-w-[92vw] sm:max-w-md px-5 py-3 rounded-2xl shadow-xl shadow-black/10 text-white text-xs sm:text-sm font-bold text-center transition-all duration-300 ${erro ? "bg-red-600 dark:bg-red-500" : "bg-emerald-600 dark:bg-emerald-500"} ${visivel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
      >
        {erro ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
        <span className="break-words">{mensagem}</span>
      </div>
    </div>
  );
}

// Aviso fixo e discreto, que fica na tela enquanto a condicao durar (ex.: sem internet).
export function AvisoFixo({ icone: Icone, children }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisivel(true), 10); return () => clearTimeout(t); }, []);

  return (
    <div className="fixed bottom-4 inset-x-0 sm:bottom-6 z-[60] flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto flex items-center gap-2.5 max-w-[92vw] sm:max-w-md px-5 py-3 rounded-2xl shadow-xl shadow-black/20 bg-stone-900/95 dark:bg-slate-800/95 backdrop-blur text-white text-xs sm:text-sm font-bold text-center transition-all duration-300 ${visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {Icone && <Icone className="w-4 h-4 shrink-0" />}
        <span className="break-words">{children}</span>
      </div>
    </div>
  );
}
