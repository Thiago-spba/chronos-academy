import { useState, useEffect } from 'react';
import { Wrench, Sparkles, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const CORES = [
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
];

export default function Pratica() {
  const [ferramentas, setFerramentas] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, 'chronos', 'ferramentas'));
        if (snap.exists() && Array.isArray(snap.data().itens)) {
          setFerramentas(snap.data().itens);
        } else {
          setFerramentas([]);
        }
      } catch (e) {
        console.error('Erro ao carregar ferramentas:', e);
        setFerramentas([]);
      }
    }
    carregar();
  }, []);

  const ativas = (ferramentas || [])
    .filter((f) => f.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-8 px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
          <Wrench className="w-4 h-4" /> Prática
        </div>
        <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100">Ferramentas de Prática</h3>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
          Treine por conta própria, quando quiser — sem precisar esperar a aula.
        </p>
      </div>

      {ferramentas === null && (
        <p className="text-sm text-stone-400 dark:text-slate-500 px-2">Carregando...</p>
      )}

      {ferramentas !== null && ativas.length === 0 && (
        <p className="text-sm text-stone-400 dark:text-slate-500 px-2">
          Nenhuma ferramenta disponível no momento.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ativas.map((f, i) => (
          
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
    </div>
  );
}
