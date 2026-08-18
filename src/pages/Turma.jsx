import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Calendar, Download, FileText, Target, Rocket, AlignLeft, ChevronDown, ChevronUp, FolderOpen, X, ListPlus, ListMinus } from 'lucide-react';
import YouTube from 'react-youtube';

// IMPORTAÇÕES DO FIREBASE
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function VideoPlayer({ titulo, videoId, duracao }) {
  const [ativo, setAtivo] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const storageKey = `@chronos_video_${videoId}`;

  const handlePlay = () => {
    setAtivo(true);
    setTimeout(() => {
      videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    const tempoSalvo = localStorage.getItem(storageKey);
    if (tempoSalvo) {
      event.target.seekTo(parseFloat(tempoSalvo));
    }
  };

  const onStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PAUSED) {
      localStorage.setItem(storageKey, event.target.getCurrentTime());
    }
  };

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime > 0) {
          localStorage.setItem(storageKey, currentTime);
        }
      }
    };
  }, []);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
    },
  };

  return (
    <div ref={videoRef} className="relative aspect-video w-full max-w-xl mx-auto bg-black rounded-xl overflow-hidden shadow-md group transition-all">
      {!ativo ? (
        <>
          <img src={thumbnailUrl} alt={titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" loading="lazy" />
          <button onClick={handlePlay} className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-amber-700" fill="currentColor"/>
            </div>
          </button>
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 text-white text-xs font-bold">{duracao}</div>
        </>
      ) : (
        <YouTube 
          videoId={videoId} 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange}
          className="w-full h-full absolute inset-0"
        />
      )}
    </div>
  );
}

export default function Turma() {
  const { id } = useParams();
  const [bancoDados, setBancoDados] = useState(null);
  
  const [aulaAtiva, setAulaAtiva] = useState(null);
  const [textosExpandidos, setTextosExpandidos] = useState({});
  const toggleTexto = (aulaId) => setTextosExpandidos(prev => ({ ...prev, [aulaId]: !prev[aulaId] }));

  // NOVO ESTADO: Controla a exibição das aulas antigas por bimestre
  const [mostrarTodasAulas, setMostrarTodasAulas] = useState({});
  const toggleMostrarAulas = (moduloId) => setMostrarTodasAulas(prev => ({ ...prev, [moduloId]: !prev[moduloId] }));

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
  }, [id]);

  useEffect(() => {
    if (aulaAtiva) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [aulaAtiva]);

  const turma = bancoDados ? bancoDados[id] : null;

  const obterNumeroAula = (aula, index) => {
    if (aula.numeroAula) {
      const parteAntesDosDoisPontos = aula.numeroAula.split(':')[0]; 
      const apenasNumeros = parteAntesDosDoisPontos.replace(/\D/g, '');
      if (apenasNumeros) return apenasNumeros;
    }
    return aula.numero || index + 1; 
  };

  if (!bancoDados) return <div className="text-center py-20 text-stone-400 font-bold">Carregando conteúdos da nuvem...</div>;
  if (!turma) return <div className="text-center py-20 text-stone-400 font-bold">Turma não encontrada.</div>;

  const temVideo = aulaAtiva ? (aulaAtiva.video || (aulaAtiva.videos && aulaAtiva.videos.length > 0)) : false;
  const temMaterial = aulaAtiva ? (aulaAtiva.pdf || (aulaAtiva.pdfs && aulaAtiva.pdfs.length > 0) || aulaAtiva.materialTexto) : false;

  return (
    <div className="animate-fade-in relative">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-black text-stone-800 dark:text-slate-100">{turma.nome}</h2>
        <p className="text-sm font-bold text-amber-600 dark:text-indigo-400 uppercase tracking-widest">{turma.disciplina}</p>
      </div>

      <div className="space-y-4">
        {turma.modulos.map((modulo) => {
          // Lógica para separar as aulas: Atrela o índice original para o número não quebrar, depois recorta as 2 últimas.
          const aulasComIndiceOriginal = modulo.aulas.map((aula, idx) => ({ ...aula, originalIndex: idx }));
          const exibirTodas = mostrarTodasAulas[modulo.id];
          const aulasParaExibir = exibirTodas ? aulasComIndiceOriginal : aulasComIndiceOriginal.slice(-2);

          return (
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
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aulasParaExibir.map((aula) => (
                        <button 
                          key={aula.id} 
                          onClick={() => setAulaAtiva(aula)}
                          className="text-left flex items-center gap-4 p-4 bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-2xl hover:border-amber-500 dark:hover:border-indigo-500 transition-all shadow-sm group"
                        >
                          <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 font-black group-hover:bg-amber-100 dark:group-hover:bg-indigo-900/40 group-hover:text-amber-700 dark:group-hover:text-indigo-400 transition-colors">
                            {obterNumeroAula(aula, aula.originalIndex)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 dark:text-slate-100 text-sm line-clamp-2">{aula.titulo}</h4>
                            <div className="flex items-center gap-2 mt-1 text-stone-500 text-xs font-bold uppercase">
                              <Calendar className="w-3 h-3"/> {aula.data}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* BOTÃO DE EXPANSÃO (Só aparece se houver mais de 2 aulas) */}
                    {modulo.aulas.length > 2 && (
                      <button 
                        onClick={() => toggleMostrarAulas(modulo.id)}
                        className="mt-4 mx-auto flex items-center gap-2 py-2 px-6 rounded-full border border-stone-200 dark:border-slate-700 text-sm font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {exibirTodas ? (
                          <><ListMinus className="w-4 h-4" /> Ocultar aulas anteriores</>
                        ) : (
                          <><ListPlus className="w-4 h-4" /> Ver todas as {modulo.aulas.length} aulas</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {aulaAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setAulaAtiva(null)}>
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl flex flex-col animate-fade-in overflow-hidden" 
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase bg-stone-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  <Calendar className="w-3 h-3"/> {aulaAtiva.data}
                </div>
              </div>
              <button onClick={() => setAulaAtiva(null)} className="p-2 bg-stone-100 dark:bg-slate-800 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors" title="Fechar aula">
                <X className="w-5 h-5 text-stone-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto">
              <h4 className="text-2xl sm:text-3xl font-black text-stone-800 dark:text-slate-100 mb-8">
                Aula {obterNumeroAula(aulaAtiva, 0)} - {aulaAtiva.titulo}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <details className="group bg-stone-50 dark:bg-slate-950 rounded-2xl border border-stone-100 dark:border-slate-800/60 overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <h5 className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-indigo-400 uppercase"><Target className="w-4 h-4" /> O que é isso?</h5>
                    <ChevronDown className="w-4 h-4 text-stone-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 pt-1 border-t border-stone-100 dark:border-slate-800/60 mt-2">
                    <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{aulaAtiva.introducao}</p>
                  </div>
                </details>

                <details className="group bg-stone-50 dark:bg-slate-950 rounded-2xl border border-stone-100 dark:border-slate-800/60 overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <h5 className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-indigo-400 uppercase"><Rocket className="w-4 h-4" /> Para que serve?</h5>
                    <ChevronDown className="w-4 h-4 text-stone-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 pt-1 border-t border-stone-100 dark:border-slate-800/60 mt-2">
                    <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">{aulaAtiva.utilidade}</p>
                  </div>
                </details>
              </div>

              {temVideo && (
                <div className="mb-8 border-t border-stone-100 dark:border-slate-800 pt-8">
                  <h5 className="text-sm font-bold text-stone-800 dark:text-slate-200 mb-6 uppercase">Videoaula(s)</h5>
                  <div className="space-y-6">
                    {aulaAtiva.video && !aulaAtiva.videos && (
                      <VideoPlayer titulo={aulaAtiva.titulo} videoId={aulaAtiva.video.videoId} duracao={aulaAtiva.video.duracao} />
                    )}
                    {aulaAtiva.videos && aulaAtiva.videos.map((vid, i) => (
                      <VideoPlayer key={i} titulo={vid.titulo || `${aulaAtiva.titulo} - Parte ${i+1}`} videoId={vid.videoId} duracao={vid.duracao} />
                    ))}
                  </div>
                </div>
              )}

              {temMaterial && (
                <div className="flex flex-col gap-3 border-t border-stone-100 dark:border-slate-800 pt-8">
                  <h5 className="text-sm font-bold text-stone-800 dark:text-slate-200 mb-2 uppercase">Material de Apoio</h5>
                  
                  {aulaAtiva.pdf && !aulaAtiva.pdfs && (
                    <a href={aulaAtiva.pdf.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-amber-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-stone-800 dark:text-slate-200">{aulaAtiva.pdf.titulo}</p>
                      </div>
                      <Download className="w-5 h-5 text-stone-400" />
                    </a>
                  )}

                  {aulaAtiva.pdfs && aulaAtiva.pdfs.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-amber-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-stone-800 dark:text-slate-200">{doc.titulo}</p>
                      </div>
                      <Download className="w-5 h-5 text-stone-400" />
                    </a>
                  ))}

                  {aulaAtiva.materialTexto && (
                    <div className="bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 p-4">
                      <button onClick={() => toggleTexto(aulaAtiva.id)} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300 font-bold text-sm">
                          <AlignLeft className="w-4 h-4 text-amber-600" /> Resumo em Texto
                        </div>
                        {textosExpandidos[aulaAtiva.id] ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                      </button>
                      {textosExpandidos[aulaAtiva.id] && (
                        <div className="mt-4 pt-4 border-t border-stone-200 dark:border-slate-800 text-sm text-stone-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                          {aulaAtiva.materialTexto}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}