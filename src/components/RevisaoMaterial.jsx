import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import MaterialEstudo from "./MaterialEstudo";
import { TEMAS_MATERIAL, pendenciasMaterial } from "../utils/temasMaterial";

// Tela de revisao do professor: tudo editavel, e os trechos que a IA acrescentou
// (fora do material da Seduc) aparecem em amarelo ate serem conferidos.
export default function RevisaoMaterial({ material, onChange, onRemover, disabled, inputClass }) {
  const [previa, setPrevia] = useState(false);
  if (!material) return null;

  const pendentes = pendenciasMaterial(material);
  const set = (campo, valor) => onChange({ ...material, [campo]: valor });
  const setItem = (lista, i, campo, valor) =>
    set(lista, material[lista].map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));
  const removerItem = (lista, i) => set(lista, material[lista].filter((_, j) => j !== i));
  const conferirTudo = () =>
    onChange({
      ...material,
      secoes: material.secoes.map((s) => ({ ...s, complemento: false })),
      termos: material.termos.map((t) => ({ ...t, complemento: false })),
    });

  const caixa = (complemento) =>
    complemento
      ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/50"
      : "border-stone-200 bg-white dark:bg-slate-900 dark:border-slate-800";

  const selo = (lista, i) => (
    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-400">
      <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Acrescentado pela IA (não estava no material) — confira</span>
      <button type="button" disabled={disabled} onClick={() => setItem(lista, i, "complemento", false)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">
        <CheckCircle2 className="w-3.5 h-3.5" /> Conferido
      </button>
    </div>
  );

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400">Revisão do material de estudo</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPrevia(!previa)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300">
            {previa ? <><Pencil className="w-3.5 h-3.5" /> Editar</> : <><Eye className="w-3.5 h-3.5" /> Ver como o aluno</>}
          </button>
          <button type="button" disabled={disabled} onClick={onRemover} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </button>
        </div>
      </div>

      {material.avisos?.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10">
          <p className="flex items-center gap-1 text-xs font-black text-amber-800 dark:text-amber-400 mb-1"><AlertTriangle className="w-4 h-4" /> A IA pediu para você conferir:</p>
          <ul className="list-disc pl-5 text-xs text-stone-700 dark:text-slate-300 space-y-0.5">
            {material.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {pendentes > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
          <span>{pendentes} {pendentes === 1 ? "trecho em amarelo precisa" : "trechos em amarelo precisam"} de conferência.</span>
          <button type="button" disabled={disabled} onClick={conferirTudo} className="underline disabled:opacity-50">Marcar todos como conferidos</button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Tudo conferido.</p>
      )}

      {previa ? (
        <MaterialEstudo material={material} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input disabled={disabled} value={material.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título do material" className={`${inputClass} sm:col-span-2`} />
            <select disabled={disabled} value={material.tema} onChange={(e) => set("tema", e.target.value)} className={inputClass}>
              {Object.entries(TEMAS_MATERIAL).map(([chave, t]) => <option key={chave} value={chave}>{t.rotulo}</option>)}
            </select>
          </div>
          <textarea disabled={disabled} rows={2} value={material.resumo} onChange={(e) => set("resumo", e.target.value)} placeholder="Resumo (1 ou 2 frases)" className={`${inputClass} resize-y`} />

          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-slate-400">Seções</p>
          {material.secoes.map((s, i) => (
            <div key={i} className={`space-y-2 p-3 rounded-xl border ${caixa(s.complemento)}`}>
              {s.complemento && selo("secoes", i)}
              <div className="flex gap-2">
                <input disabled={disabled} value={s.titulo} onChange={(e) => setItem("secoes", i, "titulo", e.target.value)} placeholder="Título da seção" className={inputClass} />
                <button type="button" disabled={disabled} onClick={() => removerItem("secoes", i)} title="Remover seção" className="text-stone-400 hover:text-red-500 p-1 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea disabled={disabled} rows={4} value={s.texto} onChange={(e) => setItem("secoes", i, "texto", e.target.value)} className={`${inputClass} resize-y`} />
            </div>
          ))}
          <button type="button" disabled={disabled} onClick={() => set("secoes", [...material.secoes, { titulo: "", texto: "", complemento: false }])} className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Adicionar seção
          </button>

          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-slate-400">Palavras-chave</p>
          {material.termos.map((t, i) => (
            <div key={i} className={`space-y-2 p-3 rounded-xl border ${caixa(t.complemento)}`}>
              {t.complemento && selo("termos", i)}
              <div className="flex gap-2">
                <input disabled={disabled} value={t.termo} onChange={(e) => setItem("termos", i, "termo", e.target.value)} placeholder="Termo" className={inputClass} />
                <button type="button" disabled={disabled} onClick={() => removerItem("termos", i)} title="Remover termo" className="text-stone-400 hover:text-red-500 p-1 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea disabled={disabled} rows={2} value={t.definicao} onChange={(e) => setItem("termos", i, "definicao", e.target.value)} placeholder="Significado" className={`${inputClass} resize-y`} />
            </div>
          ))}
          <button type="button" disabled={disabled} onClick={() => set("termos", [...material.termos, { termo: "", definicao: "", complemento: false }])} className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Adicionar palavra-chave
          </button>
        </>
      )}
    </div>
  );
}
