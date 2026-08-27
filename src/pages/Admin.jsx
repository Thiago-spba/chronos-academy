import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, Plus, Edit3, Trash2, X, Save, LogOut, GraduationCap, 
  AlertTriangle, CheckCircle2, Video, FileText, AlignLeft, Target, 
  Rocket, UploadCloud, Settings, Megaphone, Trophy, Search, Filter, Layers 
} from "lucide-react";

import { db, auth, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const turmasIniciais = {
  "2h": { nome: "2ª Séries H e L", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "1g": { nome: "1ª Séries G e J", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-dev": { nome: "2ª Série C", disciplina: "Desenvolvimento de Sistemas", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-carr": { nome: "2ª Série C", disciplina: "Carreira e Competências", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] }
};

function gerarId() { return "aula_" + Date.now().toString(36); }

function Toast({ mensagem, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 animate-slide-up">
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-sm font-semibold">{mensagem}</span>
    </div>
  );
}

function ModalConfirmar({ onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">Excluir Aula?</h3>
        </div>
        <p className="text-sm text-stone-500 dark:text-slate-400 mb-6">Esta ação apagará o conteúdo associado a esta aula. Não pode ser desfeito.</p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700">Cancelar</button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20">Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [modalAviso, setModalAviso] = useState(false);
  const [formAviso, setFormAviso] = useState({ alvo: 'global', tipo: 'comunicado', mensagem: '', duracao: 5, ativo: false });
  const [todosAvisos, setTodosAvisos] = useState({});
  const [salvandoAviso, setSalvandoAviso] = useState(false);
  const navigate = useNavigate();
  const [bancoDados, setBancoDados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  
  const [arquivosPdf, setArquivosPdf] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  
  const [modalTurmas, setModalTurmas] = useState(false);
  const [novaTurma, setNovaTurma] = useState({ id: "", nome: "", disciplina: "" });

  // ─── ESTADOS DE FILTRO E BUSCA ───
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [filtroBimestre, setFiltroBimestre] = useState("todos");

  const [form, setForm] = useState({
    id: "", turmaId: "", moduloId: "", numeroAula: "", titulo: "", semana: "",
    introducao: "", utilidade: "", materialTexto: "", 
    videos: [{ videoId: "", duracao: "" }], pdfs: []
  });

  const inputBaseClass = "w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/50 outline-none transition-colors duration-300";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAutenticado(true);
        carregarFirebase();
      } else {
        navigate("/admin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  async function carregarFirebase() {
    try {
      const docRef = doc(db, "chronos", "dados_escola");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const dados = docSnap.data();
        let precisaAtualizar = false;
        const ano = "2026";
        
        Object.keys(dados).forEach(turmaId => {
          const turma = dados[turmaId];
          
          const b3 = turma.modulos.find(m => m.id === "b3");
          if (b3 && b3.titulo === "3º Bimestre") {
            b3.titulo = `3º Bimestre - ${ano}`;
            precisaAtualizar = true;
          }
          
          const bimestres = [
            { id: `b1-${ano}`, titulo: `1º Bimestre - ${ano}` },
            { id: `b2-${ano}`, titulo: `2º Bimestre - ${ano}` },
            { id: `b3`, titulo: `3º Bimestre - ${ano}` },
            { id: `b4-${ano}`, titulo: `4º Bimestre - ${ano}` }
          ];

          bimestres.forEach(req => {
            const existe = turma.modulos.find(m => m.id === req.id || (m.id === "b3" && req.id === "b3"));
            if (!existe) {
              turma.modulos.push({ id: req.id, titulo: req.titulo, abertoPadrao: false, aulas: [] });
              precisaAtualizar = true;
            }
          });
          
          turma.modulos.sort((a, b) => a.id.localeCompare(b.id));
        });

        if (precisaAtualizar) {
          await setDoc(docRef, dados);
        }
        setBancoDados(dados);
      } else {
        await setDoc(docRef, turmasIniciais);
        setBancoDados(turmasIniciais);
      }
    } catch (error) {
      console.error("Erro Firebase:", error);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  const handleCriarTurma = async (e) => {
    e.preventDefault();
    const ano = "2026";
    const nextDb = { ...bancoDados };
    const cleanId = novaTurma.id.trim().toLowerCase().replace(/\s+/g, '-');
    
    if(nextDb[cleanId]) {
      alert("Já existe uma turma com este ID Curto!");
      return;
    }

    nextDb[cleanId] = {
      nome: novaTurma.nome,
      disciplina: novaTurma.disciplina,
      modulos: [
        { id: `b1-${ano}`, titulo: `1º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] },
        { id: `b2-${ano}`, titulo: `2º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] },
        { id: `b3-${ano}`, titulo: `3º Bimestre - ${ano}`, abertoPadrao: true, aulas: [] },
        { id: `b4-${ano}`, titulo: `4º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] }
      ]
    };
    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setNovaTurma({ id: "", nome: "", disciplina: "" });
    setToast({ mensagem: "Turma criada com sucesso!" });
  };

  const handleExcluirTurma = async (turmaId) => {
    const nextDb = { ...bancoDados };
    delete nextDb[turmaId];
    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setToast({ mensagem: "Turma excluída permanentemente." });
  };

  const carregarAvisoParaAlvo = (alvoSelecionado, avisosSalvos) => {
    const defaultAviso = avisosSalvos?.[alvoSelecionado] || { tipo: 'comunicado', mensagem: '', duracao: 5, ativo: false };
    setFormAviso({ alvo: alvoSelecionado, ...defaultAviso });
  };

  const abrirModalAviso = async () => {
    try {
      const snap = await getDoc(doc(db, 'chronos','config'));
      if (snap.exists() && snap.data().avisos) {
        setTodosAvisos(snap.data().avisos);
        carregarAvisoParaAlvo('global', snap.data().avisos);
      } else {
        setTodosAvisos({});
        setFormAviso({ alvo: 'global', tipo: 'comunicado', mensagem: '', duracao: 5, ativo: false });
      }
    } catch(e) {}
    setModalAviso(true);
  };

  const salvarAviso = async () => {
    setSalvandoAviso(true);
    try {
      const avisosAtualizados = { 
        ...todosAvisos, 
        [formAviso.alvo]: { 
          tipo: formAviso.tipo, 
          mensagem: formAviso.mensagem, 
          duracao: Number(formAviso.duracao) || 0, 
          ativo: formAviso.ativo 
        } 
      };
      await setDoc(doc(db, 'chronos', 'config'), { avisos: avisosAtualizados }, { merge: true });
      setTodosAvisos(avisosAtualizados);
      setToast({ mensagem: 'Aviso atualizado com sucesso!' });
      setModalAviso(false);
    } catch(e) { 
      alert('Erro ao salvar aviso.'); 
    } finally { 
      setSalvandoAviso(false); 
    }
  };

  const abrirNovoForm = () => {
    const primeiraTurmaId = filtroTurma !== "todas" ? filtroTurma : Object.keys(bancoDados)[0];
    const primeiroModuloId = bancoDados[primeiraTurmaId]?.modulos[0]?.id || "";
    setForm({ 
      id: "", turmaId: primeiraTurmaId, moduloId: primeiroModuloId, numeroAula: "", titulo: "", semana: "", introducao: "", utilidade: "", materialTexto: "", 
      videos: [{ videoId: "", duracao: "" }], pdfs: [] 
    });
    setArquivosPdf([]);
    setFormAberto(true);
  };

  const editarAula = (aula, turmaId, moduloId) => {
    const videosMigrados = aula.videos ? [...aula.videos] : (aula.video ? [aula.video] : [{ videoId: "", duracao: "" }]);
    const pdfsMigrados = aula.pdfs ? [...aula.pdfs] : (aula.pdf ? [aula.pdf] : []);

    setForm({
      id: aula.id, turmaId, moduloId, numeroAula: aula.numeroAula || "", titulo: aula.titulo, semana: aula.semana || "", introducao: aula.introducao || "", utilidade: aula.utilidade || "", materialTexto: aula.materialTexto || "",
      videos: videosMigrados.length > 0 ? videosMigrados : [{ videoId: "", duracao: "" }],
      pdfs: pdfsMigrados
    });
    setArquivosPdf([]);
    setFormAberto(true);
  };

  const addVideo = () => setForm({ ...form, videos: [...form.videos, { videoId: "", duracao: "" }] });
  const updateVideo = (index, field, value) => {
    const newVideos = [...form.videos];
    newVideos[index][field] = value;
    setForm({ ...form, videos: newVideos });
  };
  const removeVideo = (index) => {
    const newVideos = form.videos.filter((_, i) => i !== index);
    setForm({ ...form, videos: newVideos.length ? newVideos : [{ videoId: "", duracao: "" }] });
  };

  const removePdfAntigo = (index) => {
    const newPdfs = form.pdfs.filter((_, i) => i !== index);
    setForm({ ...form, pdfs: newPdfs });
  };

  const salvarAula = async (e) => {
    e.preventDefault();
    setSalvando(true);
    
    let pdfsFinais = [...form.pdfs];

    if (arquivosPdf.length > 0) {
      try {
        for (const file of arquivosPdf) {
          const fileRef = ref(storage, `chronos_pdfs/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
          pdfsFinais.push({ titulo: file.name, url: url, tamanho: tamanhoMB });
        }
      } catch (error) {
        console.error("Erro no upload", error);
        alert("Ocorreu um erro ao enviar os PDFs. Verifique a conexão.");
        setSalvando(false);
        return;
      }
    }

    const videosFinais = form.videos.filter(v => v.videoId.trim() !== "");

    const novaAula = {
      id: form.id || gerarId(), 
      numeroAula: form.numeroAula, 
      titulo: form.titulo, 
      semana: form.semana, 
      introducao: form.introducao, 
      utilidade: form.utilidade,
      videos: videosFinais.length > 0 ? videosFinais : null,
      pdfs: pdfsFinais.length > 0 ? pdfsFinais : null,
      materialTexto: form.materialTexto || null
    };

    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    const moduloDestino = nextDb[form.turmaId].modulos.find(m => m.id === form.moduloId);
    
    if (form.id) {
      const indexExistente = moduloDestino.aulas.findIndex(a => a.id === form.id);
      
      if (indexExistente >= 0) {
        moduloDestino.aulas[indexExistente] = novaAula;
      } else {
        Object.values(nextDb).forEach(turma => {
          turma.modulos.forEach(mod => {
            mod.aulas = mod.aulas.filter(a => a.id !== form.id);
          });
        });
        moduloDestino.aulas.push(novaAula);
      }
    } else {
      moduloDestino.aulas.push(novaAula);
    }
    
    try {
      await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
      setBancoDados(nextDb);
      setFormAberto(false);
      setToast({ mensagem: "Aula gravada com sucesso!" });
    } catch (error) {
      alert("Erro de permissão ao salvar os dados.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirAula = async () => {
    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    const modulo = nextDb[excluindo.turmaId].modulos.find(m => m.id === excluindo.moduloId);
    modulo.aulas = modulo.aulas.filter(a => a.id !== excluindo.aulaId);
    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setExcluindo(null);
    setToast({ mensagem: "Aula removida." });
  };

  // ─── LISTAGEM TOTAL DE AULAS COM METADADOS ───
  const todasAsAulas = useMemo(() => {
    if (!bancoDados) return [];
    let lista = [];
    Object.entries(bancoDados).forEach(([turmaId, turmaInfo]) => {
      turmaInfo.modulos.forEach(modulo => {
        modulo.aulas.forEach(aula => {
          lista.push({ 
            ...aula, 
            turmaId, 
            moduloId: modulo.id, 
            nomeTurma: turmaInfo.nome, 
            disciplina: turmaInfo.disciplina,
            nomeModulo: modulo.titulo 
          });
        });
      });
    });
    return lista;
  }, [bancoDados]);

  // ─── FILTRAGEM INTELIGENTE (TURMA, BIMESTRE, BUSCA) ───
  const aulasFiltradas = useMemo(() => {
    return todasAsAulas.filter(aula => {
      const matchTurma = filtroTurma === "todas" || aula.turmaId === filtroTurma;
      const matchBimestre = filtroBimestre === "todos" || aula.moduloId === filtroBimestre;
      
      const termo = busca.trim().toLowerCase();
      const matchBusca = !termo || 
        aula.titulo?.toLowerCase().includes(termo) ||
        aula.numeroAula?.toLowerCase().includes(termo) ||
        aula.semana?.toLowerCase().includes(termo) ||
        aula.introducao?.toLowerCase().includes(termo) ||
        aula.disciplina?.toLowerCase().includes(termo);

      return matchTurma && matchBimestre && matchBusca;
    });
  }, [todasAsAulas, filtroTurma, filtroBimestre, busca]);

  // ─── MÓDULOS/BIMESTRES DISPONÍVEIS PARA O FILTRO ───
  const bimestresDisponiveis = useMemo(() => {
    if (!bancoDados) return [];
    const setBim = new Map();
    Object.values(bancoDados).forEach(turma => {
      turma.modulos.forEach(m => {
        if (!setBim.has(m.id)) {
          setBim.set(m.id, m.titulo);
        }
      });
    });
    return Array.from(setBim.entries()).map(([id, titulo]) => ({ id, titulo }));
  }, [bancoDados]);

  if (!autenticado || !bancoDados) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950 font-bold text-stone-700 dark:text-slate-300">Verificando credenciais...</div>;

  return (
    <div className="animate-fade-in bg-stone-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300">
      {toast && <Toast mensagem={toast.mensagem} onClose={() => setToast(null)} />}
      {excluindo && <ModalConfirmar onConfirmar={excluirAula} onCancelar={() => setExcluindo(null)} />}

      {/* MODAL DE GERENCIAMENTO DE TURMAS */}
      {modalTurmas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2"><Settings className="w-5 h-5 text-amber-500"/> Gerenciar Turmas</h3>
              <button onClick={() => setModalTurmas(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-stone-50 dark:bg-slate-950 p-5 rounded-2xl border border-stone-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-stone-600 dark:text-slate-300 mb-4 uppercase">Criar Nova Turma (2026)</h4>
                <form onSubmit={handleCriarTurma} className="flex flex-col sm:flex-row gap-3">
                  <input required placeholder="ID Curto (ex: 3a)" value={novaTurma.id} onChange={e => setNovaTurma({...novaTurma, id: e.target.value})} className={inputBaseClass} />
                  <input required placeholder="Nome (ex: 3ª Série A)" value={novaTurma.nome} onChange={e => setNovaTurma({...novaTurma, nome: e.target.value})} className={inputBaseClass} />
                  <select required value={novaTurma.disciplina} onChange={e => setNovaTurma({...novaTurma, disciplina: e.target.value})} className={inputBaseClass}>
                    <option value="">Selecione a Disciplina...</option>
                    <option value="História">História</option>
                    <option value="Desenvolvimento de Sistemas">Desenvolvimento de Sistemas</option>
                    <option value="Carreira e Competências">Carreira e Competências</option>
                  </select>
                  <button type="submit" className="bg-amber-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors shrink-0"><Plus className="w-5 h-5"/></button>
                </form>
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-600 dark:text-slate-300 mb-4 uppercase">Turmas Ativas</h4>
                <div className="space-y-3">
                  {Object.entries(bancoDados).map(([id, info]) => (
                    <div key={id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <div className="font-black text-stone-800 dark:text-slate-100">{info.nome} <span className="text-xs font-bold text-stone-400">({id})</span></div>
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400">{info.disciplina}</div>
                      </div>
                      <button onClick={() => { if(window.confirm('CUIDADO: Excluir esta turma apagará TODAS as aulas vinculadas a ela. Confirmar exclusão?')) handleExcluirTurma(id) }} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVISO */}
      {modalAviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2"><Megaphone className="w-5 h-5 text-amber-500"/> Gerenciar Avisos</h3>
              <button onClick={() => setModalAviso(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Para quem é este aviso?</label>
                <select 
                  value={formAviso.alvo} 
                  onChange={(e) => carregarAvisoParaAlvo(e.target.value, todosAvisos)} 
                  className={inputBaseClass}
                >
                  <option value="global">🌍 Todas as Turmas (Global)</option>
                  {Object.entries(bancoDados || {}).map(([id, info]) => (
                    <option key={id} value={id}>🎯 Apenas {info.nome} ({info.disciplina})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'comunicado'})} className={`flex items-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${formAviso.tipo==='comunicado' ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 shadow-sm' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Megaphone className="w-4 h-4"/> Comunicado</button>
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'parabens'})} className={`flex items-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${formAviso.tipo==='parabens' ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 shadow-sm' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Trophy className="w-4 h-4"/> Parabéns</button>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Mensagem</label>
                <textarea rows={4} value={formAviso.mensagem} onChange={e => setFormAviso({...formAviso, mensagem: e.target.value})} placeholder="Escreva o aviso aqui..." className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none transition-colors"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Fechar em (Seg)</label>
                  <input type="number" min="0" value={formAviso.duracao} onChange={e => setFormAviso({...formAviso, duracao: Number(e.target.value)})} className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-colors" placeholder="Ex: 5" title="Deixe 0 para não fechar sozinho"/>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Status do Aviso</label>
                  <button type="button" onClick={() => setFormAviso({...formAviso, ativo: !formAviso.ativo})} className={`w-full p-4 rounded-2xl font-bold text-sm transition-all border ${formAviso.ativo ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700'}`}>{formAviso.ativo ? '✅ Publicado' : '⏸️ Oculto'}</button>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button onClick={() => setModalAviso(false)} className="flex-1 py-3.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Fechar</button>
                <button onClick={salvarAviso} disabled={salvandoAviso} className="flex-1 py-3.5 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-amber-600/30"><Save className="w-4 h-4"/> {salvandoAviso ? 'Salvando...' : 'Salvar Alterações'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DO PAINEL */}
      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 p-6 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20"><GraduationCap className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-xl font-black text-stone-800 dark:text-slate-100">Painel do Professor</h1>
            <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Chronos Academy</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"><LogOut className="w-4 h-4"/> Sair</button>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {!formAberto ? (
          <>
            {/* TOPO: TÍTULO E AÇÕES PRINCIPAIS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-500"/> Gerenciador de Aulas
                </h2>
                <p className="text-xs font-semibold text-stone-400 dark:text-slate-500 mt-1">
                  Exibindo {aulasFiltradas.length} de {todasAsAulas.length} aula(s) cadastrada(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={abrirModalAviso} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"><Megaphone className="w-4 h-4 text-amber-500"/> Avisos</button>
                <button onClick={() => setModalTurmas(true)} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"><Settings className="w-4 h-4"/> Turmas</button>
                <button onClick={abrirNovoForm} className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors text-sm"><Plus className="w-5 h-5"/> Nova Aula</button>
              </div>
            </div>

            {/* ─── FILTROS RÁPIDOS POR TURMA (CHIPS / PILLS) ─── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              <button
                onClick={() => setFiltroTurma("todas")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  filtroTurma === "todas"
                    ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20"
                    : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Todas as Turmas
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filtroTurma === "todas" ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"}`}>
                  {todasAsAulas.length}
                </span>
              </button>

              {Object.entries(bancoDados).map(([id, info]) => {
                const totalAulasTurma = info.modulos.reduce((acc, m) => acc + (m.aulas?.length || 0), 0);
                const ativa = filtroTurma === id;
                return (
                  <button
                    key={id}
                    onClick={() => setFiltroTurma(id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                      ativa
                        ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20"
                        : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{info.nome}</span>
                    <span className="text-[10px] opacity-75 font-normal">({info.disciplina.split(' ')[0]})</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${ativa ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"}`}>
                      {totalAulasTurma}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ─── BARRA DE BUSCA E FILTRO DE BIMESTRE ─── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Pesquisar por aula, assunto, semana ou conteúdo..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-sm text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                {busca && (
                  <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
                <select
                  value={filtroBimestre}
                  onChange={e => setFiltroBimestre(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs font-bold text-stone-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="todos">Todos os Bimestres</option>
                  {bimestresDisponiveis.map(b => (
                    <option key={b.id} value={b.id}>{b.titulo}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── LISTA DE CARDS DE AULAS ─── */}
            {aulasFiltradas.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-12 text-center my-6 shadow-sm">
                <Search className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-slate-700" />
                <h3 className="text-base font-bold text-stone-700 dark:text-slate-300">Nenhuma aula encontrada</h3>
                <p className="text-xs text-stone-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Tente alterar os termos da pesquisa ou selecione outra turma/bimestre acima.
                </p>
                {(busca || filtroTurma !== "todas" || filtroBimestre !== "todos") && (
                  <button 
                    onClick={() => { setBusca(""); setFiltroTurma("todas"); setFiltroBimestre("todos"); }} 
                    className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {aulasFiltradas.map(aula => {
                  const qtdVideos = aula.videos?.length || (aula.video?.videoId ? 1 : 0);
                  const qtdPdfs = aula.pdfs?.length || (aula.pdf?.url ? 1 : 0);
                  const temTexto = !!aula.materialTexto;

                  return (
                    <div key={aula.id} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-black uppercase bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded text-stone-600 dark:text-slate-300">
                            {aula.nomeTurma}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                            {aula.nomeModulo}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500 whitespace-nowrap">
                          {aula.semana || "—"}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                          {aula.numeroAula || "Aula"}
                        </span>
                        <h3 className="text-base font-black text-stone-800 dark:text-slate-100 leading-snug">
                          {aula.titulo}
                        </h3>
                      </div>

                      {aula.introducao && (
                        <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                          {aula.introducao}
                        </p>
                      )}

                      {/* BADGES DOS RECURSOS (VÍDEO, PDF, TEXTO) */}
                      <div className="flex items-center gap-2 mb-4 pt-2 border-t border-stone-100 dark:border-slate-800/60 text-[11px] text-stone-400 dark:text-slate-500 font-semibold">
                        {qtdVideos > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                            <Video className="w-3 h-3" /> {qtdVideos} vídeo(s)
                          </span>
                        )}
                        {qtdPdfs > 0 && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                            <FileText className="w-3 h-3" /> {qtdPdfs} PDF(s)
                          </span>
                        )}
                        {temTexto && (
                          <span className="flex items-center gap-1 text-stone-600 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <AlignLeft className="w-3 h-3" /> Resumo
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 border-t border-stone-100 dark:border-slate-800 pt-3 mt-auto">
                        <button 
                          onClick={() => editarAula(aula, aula.turmaId, aula.moduloId)} 
                          className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5"/> Editar
                        </button>
                        <button 
                          onClick={() => setExcluindo({ aulaId: aula.id, turmaId: aula.turmaId, moduloId: aula.moduloId })} 
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                          title="Excluir aula"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-stone-100 dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-black text-stone-800 dark:text-slate-100">{form.id ? "Editar Aula" : "Publicar Nova Aula"}</h2>
              <button onClick={() => setFormAberto(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={salvarAula} className="space-y-8">
              <div className="bg-stone-50 dark:bg-slate-950 p-6 rounded-2xl border border-stone-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-stone-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Informações Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Turma de Destino</label>
                    <select 
                      value={form.turmaId} 
                      onChange={e => {
                        const newTurmaId = e.target.value;
                        const newModuloId = bancoDados[newTurmaId]?.modulos[0]?.id || "";
                        setForm({...form, turmaId: newTurmaId, moduloId: newModuloId});
                      }} 
                      className={inputBaseClass}
                    >
                      {Object.entries(bancoDados).map(([id, info]) => <option key={id} value={id}>{info.nome} - {info.disciplina}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Bimestre / Módulo</label>
                    <select value={form.moduloId} onChange={e => setForm({...form, moduloId: e.target.value})} className={inputBaseClass}>
                      {bancoDados[form.turmaId]?.modulos.map(m => (
                        <option key={m.id} value={m.id}>{m.titulo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Identificação da Aula</label>
                    <input required value={form.numeroAula} onChange={e => setForm({...form, numeroAula: e.target.value})} placeholder="Ex: Aula 01" className={inputBaseClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Semana de Referência</label>
                    <input required value={form.semana} onChange={e => setForm({...form, semana: e.target.value})} placeholder="Ex: 1ª Semana de Agosto de 2026" className={inputBaseClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Assunto / Título da Aula</label>
                    <input required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ex: A Greve Geral de 1917" className={inputBaseClass} />
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-slate-950 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase mb-4 flex items-center gap-2"><Target className="w-4 h-4"/> O que é isso?</h3>
                  <textarea required rows={4} value={form.introducao} onChange={e => setForm({...form, introducao: e.target.value})} placeholder="Introdução direta..." className={`${inputBaseClass} resize-none`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase mb-4 flex items-center gap-2"><Rocket className="w-4 h-4"/> Para que serve?</h3>
                  <textarea required rows={4} value={form.utilidade} onChange={e => setForm({...form, utilidade: e.target.value})} placeholder="A utilidade prática..." className={`${inputBaseClass} resize-none`} />
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-slate-950 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-stone-400 dark:text-slate-500 uppercase flex items-center gap-2"><Video className="w-4 h-4"/> Vídeo(s) (YouTube)</h3>
                    <button type="button" onClick={addVideo} className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-700 transition-colors"><Plus className="w-3 h-3"/> Novo Vídeo</button>
                  </div>
                  <div className="space-y-4">
                    {form.videos.map((vid, idx) => (
                      <div key={idx} className="flex gap-2 items-start relative bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-800">
                        <div className="flex-1 space-y-3">
                          <input value={vid.videoId} onChange={e => updateVideo(idx, 'videoId', e.target.value)} placeholder="ID do Youtube (Ex: 9EfJyt5HJU0)" className={`${inputBaseClass} font-mono text-sm py-2`} />
                          <input value={vid.duracao} onChange={e => updateVideo(idx, 'duracao', e.target.value)} placeholder="Duração (Ex: 15:30)" className={`${inputBaseClass} text-sm py-2`} />
                        </div>
                        {form.videos.length > 1 && (
                          <button type="button" onClick={() => removeVideo(idx)} className="mt-1 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors" title="Remover vídeo"><Trash2 className="w-4 h-4"/></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-stone-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Material PDF</h3>
                  <div className="space-y-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-stone-300 dark:border-slate-700">
                    {form.pdfs.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest border-b border-stone-100 dark:border-slate-800 pb-1">Arquivos já salvos</p>
                        {form.pdfs.map((pdf, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-stone-50 dark:bg-slate-950 border border-stone-100 dark:border-slate-800 p-2 rounded-lg group">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate w-3/4">{pdf.titulo}</span>
                            <button type="button" onClick={() => removePdfAntigo(idx)} className="text-stone-300 dark:text-slate-600 group-hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors" title="Apagar anexo"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input type="file" multiple accept="application/pdf" onChange={e => setArquivosPdf(Array.from(e.target.files))} className="w-full text-sm text-stone-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-50 dark:file:bg-amber-950/50 file:text-amber-700 dark:file:text-amber-400 hover:file:bg-amber-100 cursor-pointer transition-colors" />
                    {arquivosPdf.length > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        {arquivosPdf.length} arquivo(s) novo(s) selecionado(s).
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-black text-stone-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Resumo em Texto (Opcional)</h3>
                  <textarea rows={5} value={form.materialTexto} onChange={e => setForm({...form, materialTexto: e.target.value})} placeholder="Digite as anotações..." className={`${inputBaseClass} resize-y`} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setFormAberto(false)} disabled={salvando} className="px-6 py-3 rounded-xl font-bold text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-8 py-3 rounded-xl font-bold text-white bg-amber-600 shadow-lg flex items-center gap-2 hover:bg-amber-700 disabled:opacity-50 transition-colors"><Save className="w-5 h-5"/> {salvando ? "Enviando..." : "Publicar Aula"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}