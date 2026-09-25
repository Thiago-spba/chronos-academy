import { useState, useEffect } from 'react';
import { Wrench, Sparkles, ExternalLink, History, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ANO_LEGADO, idModulo, tituloModulo, ordenarModulos, moduloEmAndamento } from '../utils/bimestres';

const CORES = [
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
];

// Le o documento de ferramentas em qualquer um dos dois formatos:
// novo (modulos por bimestre) ou antigo (lista unica "itens", de antes dessa funcionalidade existir).
function lerModulos(data) {
  if (Array.isArray(data?.modulos)) return data.modulos;
  if (Array.isArray(data?.itens)) {
    return [{ id: idModulo(ANO_LEGADO, 3), titulo: tituloModulo(ANO_LEGADO, 3), abertoPadrao: true, itens: data.itens }];
  }
  return [];
}

function GradeFerramentas({ itens }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {itens.map((f, i) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group bg-white dark:bg-slate-900 rounded-[2rem] border border-stone-200 dark:border-slate-800 hover:shadow-2xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 flex flex-col h-full p-6 sm:p-8"
        >
          <div className="flex items-start justify-between mb-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${CORES[i % CORES.length]}`}
            >
              Ferramenta
            </span>
            <Sparkles className="w-6 h-6 text-stone-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
          </div>
          <h3 className="text-xl font-black text-stone-800 dark:text-slate-100 mb-2">{f.titulo}</h3>
          {f.descricao && (
            <p className="text-sm font-medium text-stone-500 dark:text-slate-400 mb-6">{f.descricao}</p>
          )}
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all pt-5 mt-auto border-t border-stone-100 dark:border-slate-800">
            Abrir ferramenta <ExternalLink className="w-4 h-4" />
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Pratica() {
  const [modulos, setModulos] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, 'chronos', 'ferramentas'));
        setModulos(snap.exists() ? lerModulos(snap.data()) : []);
      } catch (e) {
        console.error('Erro ao carregar ferramentas:', e);
        setModulos([]);
      }
    }
    carregar();
  }, []);

  const carregando = modulos === null;
  const ordenados = ordenarModulos(modulos || []);
  const moduloAtual = moduloEmAndamento(ordenados) || ordenados[ordenados.length - 1] || null;
  const ativas = ((moduloAtual?.itens) || [])
    .filter((f) => f.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const modulosAnteriores = ordenados
    .filter((m) => m.id !== moduloAtual?.id)
    .filter((m) => (m.itens || []).some((f) => f.ativo !== false))
    .reverse();

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-8 px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
          <Wrench className="w-4 h-4" /> Prática
        </div>
        <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100">Ferramentas de Prática</h3>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
          Treine por conta própria, quando quiser — sem precisar esperar a aula.
          {moduloAtual && <> Bimestre atual: <strong>{moduloAtual.titulo}</strong>.</>}
        </p>
      </div>

      {carregando && (
        <p className="text-sm text-stone-400 dark:text-slate-500 px-2">Carregando...</p>
      )}

      {!carregando && ativas.length === 0 && (
        <p className="text-sm text-stone-400 dark:text-slate-500 px-2">
          Nenhuma ferramenta disponível no momento.
        </p>
      )}

      {!carregando && ativas.length > 0 && <GradeFerramentas itens={ativas} />}

      {modulosAnteriores.length > 0 && (
        <details className="group mt-10 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <summary className="flex items-center justify-between p-5 cursor-pointer bg-stone-50/50 dark:bg-slate-800/30 hover:bg-stone-50 dark:hover:bg-slate-800/80 transition-colors list-none">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-200 dark:bg-slate-950 rounded-lg text-stone-600 dark:text-slate-400"><History className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">Bimestres anteriores</h3>
                <p className="text-xs font-semibold text-stone-400 dark:text-slate-500 mt-0.5">Ferramentas de bimestres passados, se quiser dar uma olhada.</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-stone-400 dark:text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 sm:p-6 border-t border-stone-100 dark:border-slate-800 space-y-8">
            {modulosAnteriores.map((m) => (
              <div key={m.id}>
                <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">{m.titulo}</h4>
                <GradeFerramentas itens={(m.itens || []).filter((f) => f.ativo !== false).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))} />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
