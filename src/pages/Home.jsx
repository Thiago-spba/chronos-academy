import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ScrollText, MonitorPlay, Target, Award, Lightbulb, ChevronDown } from 'lucide-react';
import AnuncioPopup from '../components/AnuncioPopup';
import { db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

const turmas = [
  { id: '2h', grupo: 'fgb', serie: '2ª Série H', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '2l', grupo: 'fgb', serie: '2ª Série L', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '1g', grupo: 'fgb', serie: '1ª Série G', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '1j', grupo: 'fgb', serie: '1ª Série J', disciplina: 'História', curso: 'Novo Ensino Médio', icone: ScrollText, corBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { id: '2c-dev', grupo: 'ftp', serie: '2ª Série C', disciplina: 'Desenvolvimento de Sistemas', curso: 'Novo Ensino Médio (Hab. Profissional)', icone: MonitorPlay, corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' },
  { id: '2c-carr', grupo: 'ftp', serie: '2ª Série C', disciplina: 'Carreira e Competências', curso: 'Novo Ensino Médio (Hab. Profissional)', icone: Target, corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' }
];

const grupos = [
  { id: 'fgb', sigla: 'FGB', titulo: 'Formação Geral Básica' },
  { id: 'ftp', sigla: 'FTP', titulo: 'Formação Técnica e Profissional' }
];

const frasesPsicologia = [
  "A história explica de onde viemos; a tecnologia programa o seu futuro.",
  "O cérebro é um músculo: o esforço de hoje constrói a sua inteligência de amanhã.",
  "Não decore. Conecte ideias, entenda o porquê e aplique no seu projeto de vida.",
  "Protagonismo: você não é apenas um aluno, é o desenvolvedor do seu próprio caminho."
];

export default function Home() {
  // Mensagem motivacional da semana (gerada por IA no painel do professor).
  // Enquanto não houver uma gerada, mostra uma frase fixa como reserva.
  const [mensagemSemana, setMensagemSemana] = useState(null);
  const [textoDigitado, setTextoDigitado] = useState('');
  const [painelAberto, setPainelAberto] = useState(false);
  const [sobreAberto, setSobreAberto] = useState(false);

  // Abre o painel sozinho se houver algum aviso ativo (o sininho nao fica escondido).
  useEffect(() => {
    let cancelado = false;
    getDoc(doc(db, 'chronos', 'config'))
      .then((snap) => {
        if (cancelado || !snap.exists()) return;
        const data = snap.data();
        const avisosDb = data.avisos || data.aviso;
        if (!avisosDb) return;
        const ids = turmas.map((t) => t.id);
        const ativo =
          ids.some((id) => avisosDb[id]?.ativo) ||
          !!avisosDb['global']?.ativo ||
          !!(avisosDb.ativo && (ids.includes(avisosDb.alvo) || avisosDb.alvo === 'global'));
        if (ativo) setPainelAberto(true);
      })
      .catch(() => {});
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'chronos', 'mensagem_semana');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().texto) {
        setMensagemSemana(snap.data().texto);
      } else {
        setMensagemSemana(frasesPsicologia[Math.floor(Math.random() * frasesPsicologia.length)]);
      }
    }, () => {
      setMensagemSemana(frasesPsicologia[0]);
    });
    return () => unsubscribe();
  }, []);

  // Efeito "máquina de escrever": digita a mensagem letra por letra.
  useEffect(() => {
    if (!mensagemSemana) return;
    setTextoDigitado('');
    let i = 0;
    const intervalo = setInterval(() => {
      i += 1;
      setTextoDigitado(mensagemSemana.slice(0, i));
      if (i >= mensagemSemana.length) clearInterval(intervalo);
    }, 35);
    return () => clearInterval(intervalo);
  }, [mensagemSemana]);

  const digitando = mensagemSemana ? textoDigitado.length < mensagemSemana.length : false;

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-stone-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-8 sm:p-12 shadow-xl border border-stone-200 dark:border-slate-800 transition-colors duration-500">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-amber-400/20 via-orange-500/10 to-transparent dark:from-amber-500/10 dark:via-orange-500/5 dark:to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Portal do Professor
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-800 dark:text-slate-100 tracking-tight mb-2">Prof. Thiago Fernando</h2>
          <button
            type="button"
            onClick={() => setSobreAberto((v) => !v)}
            aria-expanded={sobreAberto}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Conheça o professor
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${sobreAberto ? 'rotate-180' : ''}`} />
          </button>
          {sobreAberto && (
            <div className="mt-4 max-w-xl space-y-4 animate-fade-in text-sm sm:text-base text-stone-600 dark:text-slate-300 leading-relaxed">
              <p>Sou o professor Thiago Fernando. Ensino e também programo, e gosto de mostrar que História e tecnologia caminham juntas.</p>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Formação</h4>
                <p>Licenciado em Matemática e em História, com pós-graduação em Metodologia da Educação. Atualmente curso Engenharia da Computação.</p>
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Como trabalho</h4>
                <p>O Chronos Academy reúne em um só lugar os materiais das aulas: PDFs, vídeos do YouTube ligados ao conteúdo e ferramentas de prática, para você estudar no seu ritmo.</p>
              </div>
              <p className="italic font-medium text-stone-500 dark:text-slate-400">Aprender é um caminho, e eu estou nele com você.</p>
            </div>
          )}
          <div className="mt-6 sm:mt-8 min-h-[3rem] flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-stone-600 dark:text-slate-300 text-sm sm:text-base font-medium italic leading-relaxed">
              "{textoDigitado}"
              {digitando && <span className="inline-block w-[2px] h-4 -mb-0.5 ml-0.5 bg-amber-500 dark:bg-amber-400 animate-pulse" />}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPainelAberto((v) => !v)}
        aria-expanded={painelAberto}
        className="w-full mb-8 px-2 flex items-center justify-between gap-4 text-left group"
      >
        <div>
          <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100">Painel de Turmas</h3>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">Selecione sua disciplina para acessar materiais e vídeos.</p>
        </div>
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex items-center justify-center text-stone-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:border-amber-400 dark:group-hover:border-amber-500/50 transition-colors">
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${painelAberto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {painelAberto && (
        <div className="animate-fade-in space-y-10">
          {grupos.map((grupo) => (
            <section key={grupo.id}>
              <div className="flex items-center gap-3 mb-4 px-2">
                <span className="px-3 py-1 rounded-lg text-[11px] font-black tracking-widest bg-stone-800 text-white dark:bg-slate-100 dark:text-slate-900">{grupo.sigla}</span>
                <h4 className="text-lg font-black text-stone-700 dark:text-slate-200">{grupo.titulo}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {turmas.filter((t) => t.grupo === grupo.id).map((turma) => {
          const Icon = turma.icone;
          return (
            /* ATENÇÃO AQUI: Retirei o overflow-hidden para o balão poder sair do card */
            <div key={turma.id} className="relative group bg-white dark:bg-slate-900 rounded-[2rem] border border-stone-200 dark:border-slate-800 hover:shadow-2xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 flex flex-col h-full">
              
              <Link to={`/turma/${turma.id}`} className="flex-1 p-6 sm:p-8 flex flex-col justify-between z-10">
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${turma.corBadge}`}>{turma.curso}</span>
                    <Icon className="w-6 h-6 text-stone-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-black text-stone-800 dark:text-slate-100 mb-2">{turma.serie}</h3>
                  <p className="text-base font-bold text-stone-500 dark:text-slate-400 mb-6">{turma.disciplina}</p>
                </div>
                
                <div className="flex items-center justify-between pt-5 mt-auto border-t border-stone-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all">
                    Entrar na sala <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-12"></div>
                </div>
              </Link>

              {/* POP-UP blindado com Z-index máximo */}
              <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] pointer-events-auto">
                <AnuncioPopup turmaId={turma.id} />
              </div>

            </div>
          );
        })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
