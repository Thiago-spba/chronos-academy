import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Calendar, Download, FileText, Target, Rocket, AlignLeft, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

// IMPORTAÇÕES DO FIREBASE
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function VideoPlayer({ titulo, videoId, duracao }) {
  const [ativo, setAtivo] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return (
    <div className="relative aspect-video max-w-lg bg-black rounded-xl overflow-hidden shadow-sm group">
      {!ativo ? (
        <>
          <img src={thumbnailUrl} alt={titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" loading="lazy" />
          <button onClick={() => setAtivo(true)} className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transform group-hover:scale-110"><Play className="w-6 h-6 text-amber-700" fill="currentColor"/></div></button>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold">{duracao}</div>
        </>
      ) : (
        <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} className="w-full h-full" allow="autoplay; fullscreen" />
      )}
    </div>
  );
}

export default function Turma() {
  const { id } = useParams();
  const [bancoDados, setBancoDados] = useState(null);
  
  // LÊ OS DADOS DO FIREBASE QUANDO O ALUNO ENTRA NA TURMA
  useEffect(() => {
    async function carregarFirebase() {
      try {
        const docRef = doc(db, 'chronos', 'dados_escola');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBancoDados(docSnap.data());
        }
      } catch (error) {
        console.error("Erro ao carregar dados da turma:", error);
      }
    }
    carregarFirebase();
  }, []);

  const turma = bancoDados ? bancoDados[id] : null;
  const [textosExpandidos, setTextosExpandidos] = useState({});
  const toggleTexto = (aulaId) => setTextosExpandidos(prev => ({ ...prev, [aulaId]: !prev[aulaId] }));

  if (!bancoDados) return <div className="text-center py-20 text-stone-400 font-bold">Carregando conteúdos da nuvem...</div>;
  if (!turma) return <div className="text-center py-20 text-stone-400 font-bold">Turma não encontrada.</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-black text-stone-800 dark:text-slate-100">{turma.nome}</h2>
        <p className="text-sm font-bold text-amber-600 dark:text-indigo-400 uppercase tracking-widest">{turma.disciplina}</p>
      </div>

      <div className="space-y-4">
        {turma.modulos.map((modulo) => (
          <details key={modulo.id} open={modulo.abertoPadrao} className="group bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <summary className="flex items-center justify-between p-5 cursor-pointer bg-stone-50/50 dark:bg-slate-800/30 list-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-200 dark:bg-slate-950 rounded-lg text-stone-600 dark:text-slate-400 group-open:bg-amber-100 dark:group-open:text-amber-700 transition-colors"><FolderOpen className="w-5 h-5"/></div>
                <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">{modulo.titulo}</h3>
              </div>
              <ChevronDown className="w-5 h-5 text-stone-400 transition-transform group-open:rotate-180" />
            </summary>

            <div className="p-4 sm:p-8 border-t border-stone-100 dark:border-slate-800 bg-stone-50/20 dark:bg-slate-950/20">
              {modulo.aulas.length === 0 ? (
                <p className="text-center text-sm text-stone-500 dark:text-slate-500 py-6">Nenhum conteúdo publicado neste bimestre ainda.</p>
              ) : (
                <div className="space-y-12">
                  {modulo.aulas.map((aula, index) => (
                    <div key={aula.id} className="relative flex flex-col sm:flex-row gap-6">
                      <div className="hidden sm:flex flex-shrink-0 mt-1"><div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border-4 border-amber-500 text-stone-800 dark:text-white font-black">{index + 1}</div></div>
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-stone-500 text-xs font-bold uppercase"><Calendar className="w-4 h-4"/> {aula.data}</div>
                        <h4 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-slate-100 mb-6">{aula.titulo}</h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                          <div className="bg-stone-50 dark:bg-slate-950 p-4 rounded-xl border border-stone-100 dark:border-slate-800/60">
                            <h5 className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-indigo-400 mb-2 uppercase"><Target className="w-4 h-4" /> O que é isso?</h5>
                            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{aula.introducao}</p>
                          </div>
                          <div className="bg-stone-50 dark:bg-slate-950 p-4 rounded-xl border border-stone-100 dark:border-slate-800/60">
                            <h5 className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-indigo-400 mb-2 uppercase"><Rocket className="w-4 h-4" /> Para que serve?</h5>
                            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{aula.utilidade}</p>
                          </div>
                        </div>

                        {aula.video && <div className="mb-6 border-t border-stone-100 dark:border-slate-800 pt-6"><VideoPlayer titulo={aula.titulo} videoId={aula.video.videoId} duracao={aula.video.duracao} /></div>}

                        {(aula.pdf || aula.materialTexto) && (
                          <div className="flex flex-col gap-3">
                            {aula.pdf && <a href={aula.pdf.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-amber-400"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-red-500" /><p className="text-sm font-bold text-stone-800 dark:text-slate-200">{aula.pdf.titulo}</p></div><Download className="w-5 h-5 text-stone-400" /></a>}
                            {aula.materialTexto && (
                              <div className="bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 p-4">
                                <button onClick={() => toggleTexto(aula.id)} className="flex items-center justify-between w-full"><div className="flex items-center gap-2 text-stone-700 dark:text-slate-300 font-bold text-sm"><AlignLeft className="w-4 h-4 text-amber-600" /> Resumo em Texto</div>{textosExpandidos[aula.id] ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}</button>
                                {textosExpandidos[aula.id] && <div className="mt-4 pt-4 border-t border-stone-200 dark:border-slate-800 text-sm text-stone-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{aula.materialTexto}</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
