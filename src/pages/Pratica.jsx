import { useState, useEffect } from 'react';
import { Wrench, Sparkles, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import SeletorBimestre from '../components/SeletorBimestre';
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
  const [escolhidoId, setEscolhidoId] = useState(null);

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
  const doBimestre = (m) => ((m && m.itens) || [])
    .filter((f) => f.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  // So aparecem os bimestres que tem alguma ferramenta visivel.
  const comFerramentas = ordenados.filter((m) => doBimestre(m).length > 0);
  const padrao = comFerramentas.find((m) => m.id === moduloAtual?.id) || comFerramentas[comFerramentas.length - 1] || null;
  const visto = comFerramentas.find((m) => m.id === escolhidoId) || padrao;
  const ativas = doBimestre(visto);

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

      {!carregando && comFerramentas.length > 1 && (
        <div className="mb-6 px-1">
          <SeletorBimestre modulos={comFerramentas} escolhidoId={visto?.id} onEscolher={setEscolhidoId} contar={(m) => doBimestre(m).length} />
        </div>
      )}

      {!carregando && ativas.length > 0 && <GradeFerramentas itens={ativas} />}
    </div>
  );
}
