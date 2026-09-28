import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// Confirmacao (troca o window.confirm nativo do navegador, que foge do visual do site).
// Uso: const { confirmar, elementoConfirmacao } = useConfirmacao();
//      if (!(await confirmar({ titulo: "Excluir?", mensagem: "..." }))) return;
//      ...e renderiza {elementoConfirmacao} uma vez, junto com os outros modais da tela.
export function ConfirmacaoModal({ titulo, mensagem, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", perigo, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${perigo ? "bg-red-50 dark:bg-red-950/50" : "bg-amber-50 dark:bg-amber-950/50"}`}>
            <AlertTriangle className={`w-5 h-5 ${perigo ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">{titulo}</h3>
        </div>
        {mensagem && (
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-line">{mensagem}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">{textoCancelar}</button>
          <button onClick={onConfirmar} className={`flex-1 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-lg transition-colors ${perigo ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"}`}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmacao() {
  const [pedido, setPedido] = useState(null); // { opcoes, resolver }

  const confirmar = (opcoes) => new Promise((resolve) => {
    setPedido({ opcoes, resolver: resolve });
  });

  const responder = (valor) => {
    pedido?.resolver(valor);
    setPedido(null);
  };

  const elementoConfirmacao = pedido ? (
    <ConfirmacaoModal {...pedido.opcoes} onConfirmar={() => responder(true)} onCancelar={() => responder(false)} />
  ) : null;

  return { confirmar, elementoConfirmacao };
}

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
