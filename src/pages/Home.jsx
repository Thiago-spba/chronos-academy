import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ScrollText, MonitorPlay, Target, Award, Lightbulb } from 'lucide-react';

const turmas = [
  { id: '2h', serie: '2ª Séries H e L', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '1g', serie: '1ª Séries G e J', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '2c-dev', serie: '2ª Série C', disciplina: 'Desenvolvimento de Sistemas', curso: 'Novo Ensino Médio (Hab. Profissional)', icone: MonitorPlay, corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' },
  { id: '2c-carr', serie: '2ª Série C', disciplina: 'Carreira e Competências', curso: 'Novo Ensino Médio (Hab. Profissional)', icone: Target, corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' }
];

const frasesPsicologia = [
  "A história explica de onde viemos; a tecnologia programa o seu futuro.",
  "O cérebro é um músculo: o esforço de hoje constrói a sua inteligência de amanhã.",
  "Não decore. Conecte ideias, entenda o porquê e aplique no seu projeto de vida.",
  "Protagonismo: você não é apenas um aluno, é o desenvolvedor do seu próprio caminho.",
  "O erro não é o fim, é apenas o feedback necessário para a próxima tentativa."
];

export default function Home() {
  const [fraseAtual, setFraseAtual] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFade(false); 
      setTimeout(() => {
        setFraseAtual((prev) => (prev + 1) % frasesPsicologia.length);
        setFade(true); 
      }, 500); 
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="animate-fade-in pb-12">
      
      {/* BANNER COM SUPORTE TOTAL A DARK MODE */}
      <div className="mb-10 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-50 to-stone-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-8 sm:p-12 shadow-xl border border-stone-200 dark:border-slate-800 transition-colors duration-500">
        
        {/* Efeitos de iluminação de fundo */}
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-amber-400/20 via-orange-500/10 to-transparent dark:from-amber-500/10 dark:via-orange-500/5 dark:to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Portal do Professor
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-stone-800 dark:text-slate-100 tracking-tight mb-2">
            Prof. Thiago Fernando
          </h2>
          
          <div className="mt-6 sm:mt-8 min-h-[3rem] flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <p className={`text-stone-600 dark:text-slate-300 text-sm sm:text-base font-medium italic transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
              "{frasesPsicologia[fraseAtual]}"
            </p>
          </div>
        </div>
      </div>

      {/* Título da Seção */}
      <div className="mb-6 px-2">
        <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100">Painel de Turmas</h3>
        <p className="text-sm text-stone-500 dark:text-slate-400">Selecione sua disciplina para acessar materiais e videoaulas.</p>
      </div>

      {/* Grid de Turmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {turmas.map((turma) => {
          const Icon = turma.icone;
          return (
            <Link 
              key={turma.id} 
              to={`/turma/${turma.id}`} 
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 p-6 sm:p-8 hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${turma.corBadge}`}>
                    {turma.curso}
                  </span>
                  <Icon className="w-6 h-6 text-stone-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                </div>
                
                <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100 mb-1">
                  {turma.serie}
                </h3>
                <p className="text-lg font-bold text-stone-500 dark:text-slate-400 mb-6">
                  {turma.disciplina}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all">
                  Entrar na sala <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}