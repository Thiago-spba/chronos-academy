import { useState } from "react";
import { BookMarked, ChevronDown, Lightbulb } from "lucide-react";
import { temaMaterial } from "../utils/temasMaterial";

// Como o aluno ve o "Material de estudo" gerado pela IA e revisado pelo professor.
export default function MaterialEstudo({ material }) {
  const [termoAberto, setTermoAberto] = useState(null);
  if (!material) return null;

  const tema = temaMaterial(material.tema);
  const { Icone } = tema;
  const secoes = material.secoes || [];
  const termos = material.termos || [];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes chronosSobe { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes chronosFlutua { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .chronos-sobe { animation: chronosSobe .5s ease-out both; }
        .chronos-flutua { animation: chronosFlutua 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .chronos-sobe, .chronos-flutua { animation: none; } }
      `}</style>

      <div className="chronos-sobe flex items-center gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
        <div className={`chronos-flutua shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${tema.cor} flex items-center justify-center shadow-lg overflow-hidden`}>
          {tema.imagem
            ? <img src={tema.imagem} alt={tema.rotulo} className="w-full h-full object-cover" />
            : <Icone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">{tema.rotulo}</p>
          <h6 className="text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 leading-tight">{material.titulo}</h6>
          {material.resumo && <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{material.resumo}</p>}
        </div>
      </div>

      <ol className="space-y-3">
        {secoes.map((s, i) => (
          <li
            key={i}
            className="chronos-sobe flex gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800"
            style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}
          >
            <span className="shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-black flex items-center justify-center">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 dark:text-slate-100">{s.titulo}</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{s.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      {termos.length > 0 && (
        <div className="chronos-sobe p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-amber-700 dark:text-amber-500 mb-3">
            <BookMarked className="w-4 h-4" /> Palavras-chave
            <span className="normal-case font-bold text-stone-400 dark:text-slate-500">(toque para ver o significado)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {termos.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTermoAberto(termoAberto === i ? null : i)}
                aria-expanded={termoAberto === i}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  termoAberto === i
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-amber-400"
                }`}
              >
                {t.termo}
                <ChevronDown className={`w-3 h-3 transition-transform ${termoAberto === i ? "rotate-180" : ""}`} />
              </button>
            ))}
          </div>
          {termoAberto !== null && termos[termoAberto] && (
            <div key={termoAberto} className="chronos-sobe mt-3 flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                <strong>{termos[termoAberto].termo}:</strong> {termos[termoAberto].definicao}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
