import { lerModulo } from '../utils/bimestres';

// Botoezinhos "1º Bim · 2º Bim · 3º Bim · 4º Bim" para escolher de qual bimestre ver as ferramentas.
// O bimestre em andamento ganha um pontinho. Se houver mais de um ano, o ano aparece junto.
export default function SeletorBimestre({ modulos, escolhidoId, onEscolher, contar }) {
  const anos = new Set(modulos.map((m) => lerModulo(m).ano));
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Escolher bimestre">
      {modulos.map((m) => {
        const { ano, bim } = lerModulo(m);
        const ativo = m.id === escolhidoId;
        const total = contar ? contar(m) : null;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={ativo}
            onClick={() => onEscolher(m.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border transition-colors ${
              ativo
                ? 'bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400'
            }`}
          >
            {bim ? `${bim}º Bimestre` : m.titulo}
            {anos.size > 1 && <span className={ativo ? 'text-amber-100' : 'text-stone-400 dark:text-slate-500'}>{ano}</span>}
            {m.abertoPadrao && <span title="Bimestre em andamento" className={`w-1.5 h-1.5 rounded-full ${ativo ? 'bg-white' : 'bg-amber-500'}`} />}
            {total !== null && <span className={`font-black ${ativo ? 'text-amber-100' : 'text-stone-400 dark:text-slate-500'}`}>{total}</span>}
          </button>
        );
      })}
    </div>
  );
}
