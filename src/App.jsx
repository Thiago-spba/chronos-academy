import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GraduationCap, Moon, Sun, ArrowLeft, ChevronDown, ChevronUp, Mail, Cpu, BookOpen, Quote, Lock } from 'lucide-react';
import Home from './pages/Home';
import Turma from './pages/Turma';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';

/* =========================================================================
   COMPONENTE: Rodapé Global Interativo (Currículo do Professor)
   ========================================================================= */
function GlobalFooter() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mt-16 mb-8 flex flex-col items-center text-center animate-fade-in w-full relative">
      <div className="inline-flex items-center gap-3 text-xs text-stone-400 dark:text-slate-500 transition-colors duration-500 mb-6 relative">
        <div className="w-10 h-px bg-stone-300 dark:bg-slate-700" />
        <span className="font-bold tracking-widest uppercase">Chronos Academy — 2026/27</span>
        <div className="w-10 h-px bg-stone-300 dark:bg-slate-700" />
        
        {/* CADEADO SECRETO PARA ACESSAR O ADMIN */}
        <Link to="/admin" className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity" title="Acesso do Professor">
          <Lock className="w-3.5 h-3.5" />
        </Link>
      </div>

      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-indigo-400 transition-all px-6 py-3 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 border border-transparent hover:border-stone-200 dark:hover:border-slate-700">
        Prof. Thiago Fernando {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <div className={`overflow-hidden transition-all duration-700 max-w-2xl w-full px-4 ${open ? 'max-h-[1200px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-10 shadow-xl dark:shadow-2xl text-left">
          
          <div className="flex gap-4 mb-8 items-start bg-stone-50/50 dark:bg-slate-950/50 p-6 rounded-2xl border border-stone-100 dark:border-slate-800/60">
            <Quote className="w-10 h-10 text-amber-500/30 dark:text-indigo-500/30 flex-shrink-0 mt-1" />
            <div className="flex flex-col gap-4">
              <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 leading-relaxed italic font-medium">"O conhecimento verdadeiro nasce quando unimos a compreensão de onde viemos com as ferramentas de para onde vamos. Através da História, entendemos a humanidade; com a Tecnologia e a Matemática, ganhamos o poder lógico para resolver problemas reais. Meu objetivo não é apenas dar aulas, mas formar mentes inquietas, capazes de questionar o passado e programar o próprio futuro."</p>
              <p className="text-base sm:text-lg text-amber-700 dark:text-amber-400 leading-relaxed font-black tracking-wide">"No entanto, todos os diplomas e especializações perdem o sentido se o aluno não cultivar dentro de si a vontade genuína de buscar o conhecimento. Se o aluno não quiser aprender, de nada vale o professor. O aprendizado é uma via de mão dupla."</p>
            </div>
          </div>

          <div className="border-t border-stone-100 dark:border-slate-800/60 pt-8 mb-8">
            <h4 className="text-xs font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest mb-6">Formação Acadêmica</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 text-sm text-stone-700 dark:text-slate-200 font-bold"><div className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-100 dark:border-slate-800 flex items-center justify-center text-amber-600 dark:text-indigo-400"><Cpu className="w-5 h-5"/></div>Engenheiro da Computação</li>
              <li className="flex items-center gap-4 text-sm text-stone-700 dark:text-slate-200 font-bold"><div className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-100 dark:border-slate-800 flex items-center justify-center text-amber-600 dark:text-indigo-400"><BookOpen className="w-5 h-5"/></div>Licenciado em Matemática e História</li>
              <li className="flex items-center gap-4 text-sm text-stone-700 dark:text-slate-200 font-bold"><div className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-100 dark:border-slate-800 flex items-center justify-center text-amber-600 dark:text-indigo-400"><GraduationCap className="w-5 h-5"/></div>Pós-graduado em Metodologia da Educação</li>
            </ul>
          </div>

          <div className="bg-stone-50 dark:bg-slate-950 p-5 rounded-2xl flex items-center gap-4 border border-stone-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-indigo-900/50 flex items-center justify-center text-amber-700 dark:text-indigo-400"><Mail className="w-6 h-6"/></div>
            <div>
              <p className="text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest mb-1">Contato Direto</p>
              <a href="mailto:thiagofernando_sp@yahoo.com.br" className="text-sm font-bold text-stone-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-indigo-400">thiagofernando_sp@yahoo.com.br</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL
   ========================================================================= */
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 transition-colors duration-500 flex flex-col relative">
      {isAdminRoute && (
        <div className="absolute top-6 right-6 z-50">
          <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 shadow-lg border border-stone-200 dark:border-slate-700">
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </div>
      )}

      {!isAdminRoute && (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 shadow-sm transition-colors duration-500">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              {!isHome && <Link to="/" className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"><ArrowLeft className="w-5 h-5"/></Link>}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 dark:from-indigo-500 dark:to-indigo-700 flex items-center justify-center shadow-md"><GraduationCap className="w-6 h-6 text-white"/></div>
                <div><h1 className="text-xl font-black text-stone-800 dark:text-slate-100 leading-none">Chronos Academy</h1><p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">História & Tecnologia</p></div>
              </Link>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full ${!isAdminRoute ? 'max-w-5xl mx-auto p-4 sm:p-6' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/turma/:id" element={<Turma />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/painel" element={<Admin />} />
        </Routes>
      </main>

      {!isAdminRoute && <GlobalFooter />}
    </div>
  );
}
