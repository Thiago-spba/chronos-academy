import { createContext, useContext } from 'react';
import { Moon, Sun } from 'lucide-react';

// O tema (claro/escuro) continua guardado no App. Aqui ele so e repassado
// para que o botao possa ficar dentro do cabecalho das telas do professor,
// em vez de flutuar por cima dos outros botoes.
export const TemaContext = createContext({ darkMode: false, alternar: () => {} });

export default function BotaoTema() {
  const { darkMode, alternar } = useContext(TemaContext);
  return (
    <button
      onClick={alternar}
      title={darkMode ? 'Tema claro' : 'Tema escuro'}
      aria-label={darkMode ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className="flex items-center px-2.5 sm:px-3 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-stone-600 dark:text-slate-300 transition-colors"
    >
      {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  );
}
