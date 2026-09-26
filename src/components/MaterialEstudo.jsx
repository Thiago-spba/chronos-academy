import { Fragment, useState } from "react";
import { BookMarked, ChevronDown, Compass, GraduationCap, Lightbulb } from "lucide-react";
import { visualDoMaterial } from "../utils/temasMaterial";
import { credencialProfessor } from "../utils/professor";

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Destaca no texto as palavras-chave (a primeira vez que cada uma aparece no bloco).
function TextoComTermos({ texto, termos, bloco, aberto, onAbrir, cor }) {
  const validos = termos.map((t, i) => ({ ...t, i })).filter((t) => t.termo && t.termo.length > 1);
  if (!texto || validos.length === 0) return texto || null;
  const ordenados = [...validos].sort((a, b) => b.termo.length - a.termo.length);
  let re;
  try {
    re = new RegExp(`(?<![\\p{L}\\p{N}_])(${ordenados.map((t) => escapar(t.termo)).join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  } catch {
    return texto;
  }
  const usados = new Set();
  const pedacos = texto.split(re);
  return pedacos.map((p, k) => {
    if (k % 2 === 0) return <Fragment key={k}>{p}</Fragment>;
    const t = validos.find((x) => x.termo.toLowerCase() === p.toLowerCase());
    if (!t || usados.has(t.i)) return <Fragment key={k}>{p}</Fragment>;
    usados.add(t.i);
    const ativo = aberto?.bloco === bloco && aberto?.i === t.i;
    return (
      <button
        key={k}
        type="button"
        onClick={() => onAbrir(ativo ? null : { bloco, i: t.i })}
        aria-expanded={ativo}
        className={`inline font-semibold underline decoration-2 decoration-dotted underline-offset-4 ${cor.destaque} ${ativo ? cor.texto : "text-inherit"} hover:opacity-80`}
      >
        {p}
      </button>
    );
  });
}

function Definicao({ termo, cor }) {
  if (!termo) return null;
  return (
    <div className={`chronos-sobe mt-3 flex gap-2 p-3 rounded-lg border ${cor.suave} ${cor.borda}`}>
      <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${cor.texto}`} />
      <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
        <strong>{termo.termo}:</strong> {termo.definicao}
      </p>
    </div>
  );
}

function Cabecalho({ layout, material, visual }) {
  const { Icone, rotulo, cor } = visual;
  const resumo = material.resumo && <p className="mt-1 text-sm leading-relaxed opacity-90">{material.resumo}</p>;

  if (layout === "faixa") {
    return (
      <div className={`chronos-sobe relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${cor.grad} text-white shadow-lg`}>
        <div className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{rotulo}</p>
            <h6 className="text-lg sm:text-xl font-black leading-tight">{material.titulo}</h6>
            {resumo}
          </div>
          <div className="chronos-flutua shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 flex items-center justify-center">
            <Icone className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (layout === "centro") {
    return (
      <div className={`chronos-sobe text-center p-6 rounded-2xl border ${cor.suave} ${cor.borda}`}>
        <div className={`chronos-flutua mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${cor.grad} flex items-center justify-center shadow-lg`}>
          <Icone className="w-10 h-10 text-white" />
        </div>
        <p className={`mt-3 text-[10px] font-black uppercase tracking-widest ${cor.texto}`}>{rotulo}</p>
        <h6 className="text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 leading-tight">{material.titulo}</h6>
        {material.resumo && <p className="mt-1 max-w-xl mx-auto text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{material.resumo}</p>}
      </div>
    );
  }

  if (layout === "trilha") {
    return (
      <div className="chronos-sobe relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
        <Icone className={`absolute -right-4 -top-4 w-32 h-32 sm:w-40 sm:h-40 opacity-10 ${cor.texto}`} aria-hidden="true" />
        <div className="relative max-w-[80%]">
          <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${cor.texto}`}>
            <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cor.grad} flex items-center justify-center`}><Icone className="w-3.5 h-3.5 text-white" /></span>
            {rotulo}
          </p>
          <h6 className="mt-2 text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 leading-tight">{material.titulo}</h6>
          {material.resumo && <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{material.resumo}</p>}
        </div>
      </div>
    );
  }

  // lateral
  return (
    <div className="chronos-sobe flex items-center gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
      <div className={`chronos-flutua shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${cor.grad} flex items-center justify-center shadow-lg`}>
        <Icone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-widest ${cor.texto}`}>{rotulo}</p>
        <h6 className="text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 leading-tight">{material.titulo}</h6>
        {material.resumo && <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{material.resumo}</p>}
      </div>
    </div>
  );
}

// Como o aluno ve o "Material de estudo" gerado pela IA e revisado pelo professor.
export default function MaterialEstudo({ material, disciplina }) {
  const [aberto, setAberto] = useState(null);
  if (!material) return null;

  const visual = visualDoMaterial(material);
  const { cor, layout } = visual;
  const secoes = material.secoes || [];
  const termos = material.termos || [];
  const professor = credencialProfessor(disciplina);
  const termoAberto = (bloco) => (aberto?.bloco === bloco ? termos[aberto.i] : null);
  const marcar = (textoBloco, bloco) => (
    <TextoComTermos texto={textoBloco} termos={termos} bloco={bloco} aberto={aberto} onAbrir={setAberto} cor={cor} />
  );
  const atraso = (i) => ({ animationDelay: `${Math.min(i, 8) * 80}ms` });

  const secaoConteudo = (s, i) => (
    <>
      <p className="text-sm font-bold text-stone-800 dark:text-slate-100">{s.titulo}</p>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{marcar(s.texto, `s${i}`)}</p>
      <Definicao termo={termoAberto(`s${i}`)} cor={cor} />
    </>
  );

  let listaSecoes;
  if (layout === "faixa") {
    listaSecoes = (
      <div className="space-y-3">
        {secoes.map((s, i) => (
          <div key={i} className="chronos-sobe relative pl-5 pr-4 py-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 overflow-hidden" style={atraso(i)}>
            <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${cor.linha}`} aria-hidden="true" />
            <p className={`text-[10px] font-black tracking-widest ${cor.texto}`}>{String(i + 1).padStart(2, "0")}</p>
            {secaoConteudo(s, i)}
          </div>
        ))}
      </div>
    );
  } else if (layout === "centro") {
    listaSecoes = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {secoes.map((s, i) => (
          <div key={i} className="chronos-sobe p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800" style={atraso(i)}>
            <span className={`inline-block mb-2 px-2 py-0.5 rounded-md text-[11px] font-black ${cor.marca}`}>{i + 1}</span>
            {secaoConteudo(s, i)}
          </div>
        ))}
      </div>
    );
  } else if (layout === "trilha") {
    listaSecoes = (
      <ol className="relative ml-3.5 space-y-5">
        <span className={`absolute left-0 top-2 bottom-2 w-0.5 opacity-40 ${cor.linha}`} aria-hidden="true" />
        {secoes.map((s, i) => (
          <li key={i} className="chronos-sobe relative pl-8" style={atraso(i)}>
            <span className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-gradient-to-br ${cor.grad} text-white text-xs font-black flex items-center justify-center shadow`}>{i + 1}</span>
            {secaoConteudo(s, i)}
          </li>
        ))}
      </ol>
    );
  } else {
    listaSecoes = (
      <ol className="space-y-3">
        {secoes.map((s, i) => (
          <li key={i} className="chronos-sobe flex gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800" style={atraso(i)}>
            <span className={`shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${cor.marca}`}>{i + 1}</span>
            <div className="min-w-0 flex-1">{secaoConteudo(s, i)}</div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes chronosSobe { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes chronosFlutua { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .chronos-sobe { animation: chronosSobe .5s ease-out both; }
        .chronos-flutua { animation: chronosFlutua 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .chronos-sobe, .chronos-flutua { animation: none; } }
      `}</style>

      <Cabecalho layout={layout} material={material} visual={visual} />

      {material.contexto && (
        <div className={`chronos-sobe p-4 rounded-xl border ${cor.suave} ${cor.borda}`}>
          <p className={`flex items-center gap-2 text-xs font-black uppercase mb-1.5 ${cor.texto}`}><Compass className="w-4 h-4" /> Para começar</p>
          <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">{marcar(material.contexto, "ctx")}</p>
          <Definicao termo={termoAberto("ctx")} cor={cor} />
        </div>
      )}

      {listaSecoes}

      {termos.length > 0 && (
        <div className="chronos-sobe p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
          <p className={`flex items-center gap-2 text-xs font-black uppercase mb-1 ${cor.texto}`}>
            <BookMarked className="w-4 h-4" /> Palavras-chave
          </p>
          <p className="text-[11px] font-bold text-stone-400 dark:text-slate-500 mb-3">Toque numa palavra para ver o significado. No texto, elas aparecem sublinhadas.</p>
          <div className="flex flex-wrap gap-2">
            {termos.map((t, i) => {
              const ativo = aberto?.bloco === "lista" && aberto?.i === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAberto(ativo ? null : { bloco: "lista", i })}
                  aria-expanded={ativo}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    ativo
                      ? `bg-gradient-to-br ${cor.grad} border-transparent text-white`
                      : "bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-stone-400"
                  }`}
                >
                  {t.termo}
                  <ChevronDown className={`w-3 h-3 transition-transform ${ativo ? "rotate-180" : ""}`} />
                </button>
              );
            })}
          </div>
          <Definicao termo={termoAberto("lista")} cor={cor} />
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <span className={`shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${cor.grad} flex items-center justify-center`}>
          <GraduationCap className="w-4.5 h-4.5 text-white" />
        </span>
        <p className="text-xs text-stone-500 dark:text-slate-400 leading-snug">
          Material preparado por <strong className="text-stone-700 dark:text-slate-200">{professor.nome}</strong>
          <br />{professor.formacao}
        </p>
      </div>
    </div>
  );
}
