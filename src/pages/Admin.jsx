import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, Plus, Edit3, Trash2, X, Save, LogOut, GraduationCap, 
  AlertTriangle, CheckCircle2, Video, FileText, AlignLeft, Target, 
  Rocket, UploadCloud, Settings, Megaphone, Trophy, Search, Filter, Layers,
  ChevronLeft, ChevronRight, LayoutGrid, List, Users, Sparkles, Clock, Eye, Wrench, Loader2
} from "lucide-react";

import { db, auth, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { lerModulo, chaveModulo, ordenarModulos, tituloModulo, idModulo, acharModulo, opcoesModulos, deveMarcarAndamento, moduloPadraoId } from "../utils/bimestres";
import RevisaoMaterial from "../components/RevisaoMaterial";
import { pendenciasMaterial } from "../utils/temasMaterial";

const turmasIniciais = {
  "2h": { nome: "2ª Séries H e L", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2l": { nome: "2ª Séries H e L", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "1g": { nome: "1ª Séries G e J", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "1j": { nome: "1ª Séries G e J", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-dev": { nome: "2ª Série C", disciplina: "Desenvolvimento de Sistemas", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-carr": { nome: "2ª Série C", disciplina: "Carreira e Competências", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] }
};

function gerarId() { return "aula_" + Date.now().toString(36); }

function formatarAtualizacao(iso) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "há 1 dia";
  if (diffD < 30) return `há ${diffD} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Toast({ mensagem, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 animate-slide-up max-w-[90vw] sm:max-w-md">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold break-words">{mensagem}</span>
    </div>
  );
}

function ModalConfirmar({ onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">Excluir Aula?</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mb-6 leading-relaxed">
          Esta ação apagará o conteúdo associado a esta aula em todas as turmas vinculadas.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors">Excluir</button>
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
  const [statusEnvio, setStatusEnvio] = useState("");
  const [toast, setToast] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  
  const [arquivosPdf, setArquivosPdf] = useState([]);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [gerandoMaterial, setGerandoMaterial] = useState(false);
  const [carregandoMaterial, setCarregandoMaterial] = useState(false);
  const [prioridadesIA, setPrioridadesIA] = useState("");
  const [textoColadoIA, setTextoColadoIA] = useState("");
  const [iaExcluidos, setIaExcluidos] = useState({}); // anexos desmarcados: a IA ignora
  const [sugestoesVideos, setSugestoesVideos] = useState(null); // null = painel fechado
  const [buscaVideo, setBuscaVideo] = useState("");
  const [gerandoMensagem, setGerandoMensagem] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  
  // ─── GERENCIAMENTO DE TURMAS ───
  const [modalTurmas, setModalTurmas] = useState(false);
  const [tipoCriacaoTurma, setTipoCriacaoTurma] = useState("unida");
  const [novaTurma, setNovaTurma] = useState({ 
    ano: "2ª Série", 
    letras: "H e L", 
    nomePersonalizado: "", 
    idCurto: "", 
    disciplina: "História", 
    disciplinaOutra: "" 
  });

  // ─── FILTROS, BUSCA E VISUALIZAÇÃO ───
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [filtroBimestre, setFiltroBimestre] = useState("todos");
  const [modoVisualizacao, setModoVisualizacao] = useState("grade");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);
  const [marcarAndamento, setMarcarAndamento] = useState(null); // null = usa a sugestao automatica

  const [form, setForm] = useState({
    id: "", turmaId: "", moduloId: "", numeroAula: "", titulo: "", semana: "",
    introducao: "", utilidade: "", materialTexto: "", 
    videos: [{ videoId: "", duracao: "" }], pdfs: [], materialEstudo: null
  });

  const inputBaseClass = "w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/50 outline-none text-xs sm:text-sm transition-colors duration-300";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "thiago.rpba@gmail.com") {
        setAutenticado(true);
        carregarFirebase();
        verificarMensagemSemanal();
      } else {
        if (user) signOut(auth); // conta sem permissão — desloga na hora
        navigate("/admin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ─── MENSAGEM MOTIVACIONAL SEMANAL (IA) ───
  async function verificarMensagemSemanal() {
    try {
      const docRef = doc(db, "chronos", "mensagem_semana");
      const docSnap = await getDoc(docRef);
      const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
      const precisaGerar = !docSnap.exists() || (Date.now() - new Date(docSnap.data().geradaEm).getTime() > seteDiasMs);
      if (precisaGerar) {
        await gerarNovaMensagem();
      }
    } catch (error) {
      console.error("Erro ao verificar mensagem semanal:", error);
    }
  }

  async function gerarNovaMensagem() {
    setGerandoMensagem(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const resp = await fetch("/api/gerar-mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error(data.erro || "Erro ao gerar mensagem motivacional.");
        return;
      }
      await setDoc(doc(db, "chronos", "mensagem_semana"), {
        texto: data.texto,
        geradaEm: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao gerar mensagem motivacional:", error);
    } finally {
      setGerandoMensagem(false);
    }
  }

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroTurma, filtroBimestre, itensPorPagina]);

  useEffect(() => {
    setMarcarAndamento(null);
  }, [formAberto, form.turmaId, form.moduloId]);

  useEffect(() => {
    setIaExcluidos({});
    setSugestoesVideos(null);
  }, [formAberto]);

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
          if (!turma.modulos) turma.modulos = [];
          
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

          const temAnoLegado = turma.modulos.some(m => lerModulo(m).ano === Number(ano));
          bimestres.forEach(req => {
            if (!temAnoLegado) return;
            const existe = turma.modulos.find(m => m.id === req.id || (m.id === "b3" && req.id === "b3"));
            if (!existe) {
              turma.modulos.push({ id: req.id, titulo: req.titulo, abertoPadrao: false, aulas: [] });
              precisaAtualizar = true;
            }
          });
          
          turma.modulos = ordenarModulos(turma.modulos);
        });

        // ─── SINCRONIZAÇÃO AUTOMÁTICA DE TURMAS IRMÃS (H/L e G/J) ───
        const paresIrmaos = [
          { principal: "2h", secundaria: "2l", nomeUnificado: "2ª Séries H e L" },
          { principal: "1g", secundaria: "1j", nomeUnificado: "1ª Séries G e J" }
        ];

        paresIrmaos.forEach(({ principal, secundaria, nomeUnificado }) => {
          if (dados[principal] && dados[secundaria]) {
            dados[principal].nome = nomeUnificado;
            dados[secundaria].nome = nomeUnificado;
            
            const aulasP = dados[principal].modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
            const aulasS = dados[secundaria].modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
            
            if (aulasP > 0 && aulasS === 0) {
              dados[secundaria].modulos = JSON.parse(JSON.stringify(dados[principal].modulos));
              precisaAtualizar = true;
            } else if (aulasS > 0 && aulasP === 0) {
              dados[principal].modulos = JSON.parse(JSON.stringify(dados[secundaria].modulos));
              precisaAtualizar = true;
            }
          }
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
    const ano = String(new Date().getFullYear());
    const nextDb = { ...bancoDados };

    let nomeFinal = "";
    let idFinal = "";

    if (tipoCriacaoTurma === "unida") {
      nomeFinal = `${novaTurma.ano}s ${novaTurma.letras.trim()}`;
      idFinal = novaTurma.idCurto.trim() || `${novaTurma.ano.charAt(0)}${novaTurma.letras.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
    } else {
      nomeFinal = novaTurma.nomePersonalizado.trim();
      idFinal = novaTurma.idCurto.trim();
    }

    const cleanId = idFinal.trim().toLowerCase().replace(/\s+/g, '-');
    
    if(!cleanId || !nomeFinal) {
      alert("Por favor, preencha todos os campos da turma!");
      return;
    }

    if(nextDb[cleanId]) {
      alert("Já existe uma turma cadastrada com este ID!");
      return;
    }

    const disciplinaFinal = novaTurma.disciplina === "Outra" 
      ? (novaTurma.disciplinaOutra?.trim() || "Geral") 
      : novaTurma.disciplina;

    nextDb[cleanId] = {
      nome: nomeFinal,
      disciplina: disciplinaFinal,
      modulos: [
        { id: `b1-${ano}`, titulo: `1º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] },
        { id: `b2-${ano}`, titulo: `2º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] },
        { id: `b3-${ano}`, titulo: `3º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] },
        { id: `b4-${ano}`, titulo: `4º Bimestre - ${ano}`, abertoPadrao: false, aulas: [] }
      ]
    };
    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setNovaTurma({ ano: "2ª Série", letras: "H e L", nomePersonalizado: "", idCurto: "", disciplina: "História", disciplinaOutra: "" });
    setToast({ mensagem: `Turma "${nomeFinal}" criada com sucesso!` });
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

  const salvarAviso = async (publicar) => {
    setSalvandoAviso(true);
    try {
      const avisosAtualizados = { 
        ...todosAvisos, 
        [formAviso.alvo]: { 
          tipo: formAviso.tipo, 
          mensagem: formAviso.mensagem, 
          duracao: Number(formAviso.duracao) || 0, 
          ativo: typeof publicar === 'boolean' ? publicar : formAviso.ativo,
          publicadoEm: publicar === true ? Date.now() : (todosAvisos?.[formAviso.alvo]?.publicadoEm || null)
        } 
      };
      await setDoc(doc(db, 'chronos', 'config'), { avisos: avisosAtualizados }, { merge: true });
      setTodosAvisos(avisosAtualizados);
      setToast({ mensagem: publicar === true ? 'Aviso PUBLICADO! Os alunos já veem o sininho aceso.' : publicar === false ? 'Aviso ocultado.' : 'Aviso atualizado com sucesso!' });
      setModalAviso(false);
    } catch(e) { 
      alert('Erro ao salvar aviso.'); 
    } finally { 
      setSalvandoAviso(false); 
    }
  };

  const abrirNovoForm = () => {
    const primeiraTurmaId = filtroTurma !== "todas" ? filtroTurma : Object.keys(bancoDados)[0];
    const modulosTurma = bancoDados[primeiraTurmaId]?.modulos || [];

    let moduloPadraoId = modulosTurma[modulosTurma.length - 1]?.id || "";
    let ultimoId = "";
    modulosTurma.forEach(mod => {
      mod.aulas?.forEach(aula => {
        if (aula.id > ultimoId) {
          ultimoId = aula.id;
          moduloPadraoId = mod.id;
        }
      });
    });

    setForm({ 
      id: "", turmaId: primeiraTurmaId, moduloId: moduloPadraoId, numeroAula: "", titulo: "", semana: "", introducao: "", utilidade: "", materialTexto: "", 
      videos: [{ videoId: "", duracao: "" }], pdfs: [], materialEstudo: null
    });
    setArquivosPdf([]);
    setPrioridadesIA("");
    setTextoColadoIA("");
    setStatusEnvio("");
    setFormAberto(true);
  };

  const editarAula = (aula, turmaId, moduloId) => {
    const videosMigrados = aula.videos ? [...aula.videos] : (aula.video ? [aula.video] : [{ videoId: "", duracao: "" }]);
    const pdfsMigrados = aula.pdfs ? [...aula.pdfs] : (aula.pdf ? [aula.pdf] : []);

    setForm({ 
      id: aula.id, turmaId, moduloId, numeroAula: aula.numeroAula || "", titulo: aula.titulo, semana: aula.semana || "", introducao: aula.introducao || "", utilidade: aula.utilidade || "", materialTexto: aula.materialTexto || "", 
      videos: videosMigrados.length > 0 ? videosMigrados : [{ videoId: "", duracao: "" }], 
      pdfs: pdfsMigrados,
      materialEstudo: null
    });
    setArquivosPdf([]);
    setPrioridadesIA("");
    setTextoColadoIA("");
    setStatusEnvio("");
    setFormAberto(true);
    if (aula.temMaterialEstudo) carregarMaterialEstudo(aula.id);
  };

  const carregarMaterialEstudo = async (aulaId) => {
    setCarregandoMaterial(true);
    try {
      const snap = await getDoc(doc(db, "chronos", `material_${aulaId}`));
      const m = snap.exists() ? snap.data() : null;
      setForm(prev => (prev.id === aulaId ? { ...prev, materialEstudo: m, materialEstudoErro: false } : prev));
    } catch (e) {
      console.error(e);
      // Se falhar, a aula continua marcada como "tem material" e o material salvo nao e apagado.
      setForm(prev => (prev.id === aulaId ? { ...prev, materialEstudoErro: true } : prev));
    } finally {
      setCarregandoMaterial(false);
    }
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

  const arquivoParaBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // ─── ANEXOS PDF (VARIOS) E ESCOLHA DO QUE A IA LE ───
  const chaveNovoPdf = (f) => "n:" + f.name + ":" + f.size;
  const chaveSalvoPdf = (p) => "s:" + p.url;
  const adicionarAnexos = (lista) => setArquivosPdf(prev => {
    const ja = new Set(prev.map(chaveNovoPdf));
    return [...prev, ...lista.filter(f => !ja.has(chaveNovoPdf(f)))];
  });
  const removerAnexoNovo = (indice) => setArquivosPdf(prev => prev.filter((_, i) => i !== indice));
  const alternarIA = (chave) => setIaExcluidos(prev => ({ ...prev, [chave]: !prev[chave] }));
  const anexosDaIA = () => ({
    novos: arquivosPdf.filter(f => !iaExcluidos[chaveNovoPdf(f)]),
    salvos: form.pdfs.filter(p => !iaExcluidos[chaveSalvoPdf(p)]),
  });
  const anexosIA = anexosDaIA();
  const qtdAnexosIA = anexosIA.novos.length + anexosIA.salvos.length;
  const totalAnexos = form.pdfs.length + arquivosPdf.length;

  const gerarComIA = async () => {
    setGerandoIA(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const payload = { idToken, tituloAula: form.titulo };
      const { novos, salvos } = anexosDaIA();
      const total = novos.length + salvos.length;
      const LIMITE_BASE64 = 3 * 1024 * 1024; // acima disso, PDFs novos sobem antes para o Storage

      if (total === 0) {
        alert(totalAnexos === 0 ? "Anexe um PDF antes de gerar com IA." : "Marque pelo menos um PDF para a IA ler.");
        return;
      }
      if (total > 5) {
        alert("Marque no maximo 5 PDFs por vez.");
        return;
      }

      if (total === 1 && novos.length === 1 && novos[0].size <= LIMITE_BASE64) {
        payload.pdfBase64 = await arquivoParaBase64(novos[0]);
      } else if (total === 1 && salvos.length === 1) {
        payload.pdfUrl = salvos[0].url;
      } else {
        const pdfs = salvos.map(p => ({ url: p.url, nome: p.titulo }));
        const somaNovos = novos.reduce((s, f) => s + f.size, 0);
        if (somaNovos <= LIMITE_BASE64) {
          for (const f of novos) {
            pdfs.push({ base64: await arquivoParaBase64(f), nome: f.name });
          }
        } else {
          // arquivos novos grandes: sobem agora (viram anexos salvos) e a IA le pelo endereco
          const enviados = [];
          for (let i = 0; i < novos.length; i++) {
            const fileRef = ref(storage, `chronos_pdfs/${Date.now()}_${novos[i].name}`);
            await uploadBytes(fileRef, novos[i]);
            const url = await getDownloadURL(fileRef);
            enviados.push({ titulo: novos[i].name, url, tamanho: (novos[i].size / (1024 * 1024)).toFixed(2) + " MB" });
          }
          setForm(prev => ({ ...prev, pdfs: [...prev.pdfs, ...enviados] }));
          setArquivosPdf(prev => prev.filter(f => !novos.includes(f)));
          enviados.forEach(p => pdfs.push({ url: p.url, nome: p.titulo }));
        }
        payload.pdfs = pdfs;
      }

      const resp = await fetch("/api/gerar-conteudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await resp.json(); } catch (e) { data = {}; }
      if (!resp.ok) {
        alert(data.erro || (resp.status === 413 ? "Os PDFs sao grandes demais para enviar de uma vez. Marque menos arquivos." : "Erro ao gerar conteudo com IA."));
        return;
      }
      setForm(prev => ({ ...prev, introducao: data.introducao, utilidade: data.utilidade, materialTexto: data.materialTexto }));
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar conteudo com IA.");
    } finally {
      setGerandoIA(false);
    }
  };

  // ─── MATERIAL DE ESTUDO (a IA le o material da Seduc; o professor revisa antes de publicar) ───
  const gerarMaterialEstudo = async () => {
    const { novos, salvos } = anexosDaIA();
    const total = novos.length + salvos.length;
    const texto = textoColadoIA.trim();
    if (total === 0 && !texto) {
      alert("Anexe um PDF ou cole o texto do material antes de gerar.");
      return;
    }
    if (total > 5) {
      alert("Marque no maximo 5 PDFs por vez.");
      return;
    }
    if (form.materialEstudo && !window.confirm("Esta aula ja tem um material de estudo. Gerar de novo vai substituir o atual (e as suas edicoes). Continuar?")) return;

    setGerandoMaterial(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const payload = {
        idToken,
        tituloAula: form.titulo,
        disciplina: bancoDados?.[form.turmaId]?.disciplina || "",
        prioridades: prioridadesIA.trim(),
      };
      if (texto) payload.textoColado = texto;

      if (total > 0) {
        // limite de envio da Vercel: arquivos novos grandes sobem antes para o Storage
        const LIMITE_BASE64 = (texto ? 2.5 : 3) * 1024 * 1024;
        const pdfs = salvos.map(p => ({ url: p.url, nome: p.titulo }));
        const somaNovos = novos.reduce((s, f) => s + f.size, 0);
        if (somaNovos <= LIMITE_BASE64) {
          for (const f of novos) {
            pdfs.push({ base64: await arquivoParaBase64(f), nome: f.name });
          }
        } else {
          const enviados = [];
          for (let i = 0; i < novos.length; i++) {
            const fileRef = ref(storage, `chronos_pdfs/${Date.now()}_${novos[i].name}`);
            await uploadBytes(fileRef, novos[i]);
            const url = await getDownloadURL(fileRef);
            enviados.push({ titulo: novos[i].name, url, tamanho: (novos[i].size / (1024 * 1024)).toFixed(2) + " MB" });
          }
          setForm(prev => ({ ...prev, pdfs: [...prev.pdfs, ...enviados] }));
          setArquivosPdf(prev => prev.filter(f => !novos.includes(f)));
          enviados.forEach(p => pdfs.push({ url: p.url, nome: p.titulo }));
        }
        payload.pdfs = pdfs;
      }

      const resp = await fetch("/api/gerar-material-estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await resp.json(); } catch (e) { data = {}; }
      if (!resp.ok || !data.material) {
        alert(data.erro || (resp.status === 413 ? "O material e grande demais para enviar de uma vez. Marque menos PDFs." : (resp.status === 504 ? "A IA demorou demais. Tente com menos paginas ou menos PDFs." : "Erro ao gerar o material de estudo.")));
        return;
      }
      setForm(prev => ({ ...prev, materialEstudo: data.material, materialEstudoErro: false }));
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar o material de estudo.");
    } finally {
      setGerandoMaterial(false);
    }
  };

  const removerMaterialEstudo = () => {
    if (!window.confirm("Remover o material de estudo desta aula? (Os alunos deixam de ver depois que voce salvar a aula.)")) return;
    setForm(prev => ({ ...prev, materialEstudo: null, materialEstudoErro: false }));
  };

  // ─── SUGESTAO DE VIDEOS DO YOUTUBE (EM PORTUGUES, COM AJUDA DA IA) ───
  const buscarVideosYoutube = async (termoManual) => {
    const t = String(termoManual ?? buscaVideo).trim();
    if (t && t.length < 3) {
      setSugestoesVideos({ carregando: false, erro: "Digite pelo menos 3 letras para buscar.", aviso: "", itens: [], buscou: true, ia: false });
      return;
    }
    const disciplina = bancoDados?.[form.turmaId]?.disciplina || "";
    setSugestoesVideos({ carregando: true, erro: "", aviso: "", itens: [], buscou: true, ia: false });
    try {
      const idToken = await auth.currentUser.getIdToken();
      const resp = await fetch("/api/sugerir-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          busca: t || undefined,
          tituloAula: form.titulo,
          disciplina,
          introducao: form.introducao,
          utilidade: form.utilidade,
          materialTexto: form.materialTexto,
        }),
      });
      let data = {};
      try { data = await resp.json(); } catch (e) { data = {}; }
      if (!resp.ok) {
        const erro = data.erro === "YOUTUBE_API_KEY_AUSENTE"
          ? "A chave do YouTube ainda nao foi configurada na Vercel (nome: YOUTUBE_API_KEY)."
          : (data.erro || "Nao foi possivel buscar videos agora.");
        setSugestoesVideos({ carregando: false, erro, aviso: "", itens: [], buscou: true, ia: false });
        return;
      }
      setSugestoesVideos({ carregando: false, erro: "", aviso: data.aviso || "", itens: data.videos || [], buscou: true, ia: !!data.ia });
    } catch (e) {
      console.error(e);
      setSugestoesVideos({ carregando: false, erro: "Nao foi possivel buscar videos agora.", aviso: "", itens: [], buscou: true, ia: false });
    }
  };

  const abrirSugestoesVideos = () => {
    setBuscaVideo("");
    const temContexto = form.titulo.trim() || form.introducao.trim() || form.materialTexto.trim();
    if (temContexto) {
      buscarVideosYoutube("");
    } else {
      setSugestoesVideos({ carregando: false, erro: "Escreva o título da aula (ou use o campo de busca abaixo) antes de pedir sugestões.", aviso: "", itens: [], buscou: false, ia: false });
    }
  };

  const usarVideoSugerido = (v) => {
    setForm(prev => {
      if (prev.videos.some(x => x.videoId === v.videoId)) return prev;
      const novo = { videoId: v.videoId, duracao: v.duracao || "" };
      const vazio = prev.videos.findIndex(x => !String(x.videoId || "").trim());
      if (vazio >= 0) {
        const copia = [...prev.videos];
        copia[vazio] = novo;
        return { ...prev, videos: copia };
      }
      return { ...prev, videos: [...prev.videos, novo] };
    });
  };

  const salvarAula = async (e) => {
    e.preventDefault();
    if (salvando) return;
    if (carregandoMaterial || gerandoMaterial) {
      alert("Aguarde o material de estudo terminar de carregar.");
      return;
    }
    const pendentesMaterial = pendenciasMaterial(form.materialEstudo);
    if (pendentesMaterial > 0 && !window.confirm(`O material de estudo ainda tem ${pendentesMaterial} trecho(s) em amarelo sem conferir. Publicar mesmo assim?`)) return;
    setSalvando(true);
    
    let pdfsFinais = [...form.pdfs];

    if (arquivosPdf.length > 0) {
      try {
        for (let i = 0; i < arquivosPdf.length; i++) {
          const file = arquivosPdf[i];
          setStatusEnvio(`Enviando PDF (${i + 1}/${arquivosPdf.length})...`);
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
        setStatusEnvio("");
        return;
      }
    }

    setStatusEnvio("Gravando dados da aula...");

    const videosFinais = form.videos.filter(v => v.videoId.trim() !== "");

    const idAula = form.id || gerarId();

    if (form.materialEstudo && !form.materialEstudoErro) {
      try {
        setStatusEnvio("Gravando material de estudo...");
        await setDoc(doc(db, "chronos", `material_${idAula}`), {
          ...form.materialEstudo,
          aulaId: idAula,
          atualizadoEm: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Erro ao gravar material de estudo", error);
        alert("Erro ao gravar o material de estudo. A aula nao foi salva; tente de novo.");
        setSalvando(false);
        setStatusEnvio("");
        return;
      }
      setStatusEnvio("Gravando dados da aula...");
    }

    const novaAula = {
      id: idAula, 
      numeroAula: form.numeroAula, 
      titulo: form.titulo, 
      semana: form.semana, 
      introducao: form.introducao, 
      utilidade: form.utilidade, 
      videos: videosFinais.length > 0 ? videosFinais : null, 
      pdfs: pdfsFinais.length > 0 ? pdfsFinais : null, 
      materialTexto: form.materialTexto || null,
      temMaterialEstudo: form.materialEstudoErro ? true : !!form.materialEstudo
    };

    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    
    // Identifica se a turma possui espelhos/irmãs para sincronizar tudo junto
    const turmasAlvo = [form.turmaId];
    if (form.turmaId === "2h" && nextDb["2l"]) turmasAlvo.push("2l");
    if (form.turmaId === "2l" && nextDb["2h"]) turmasAlvo.push("2h");
    if (form.turmaId === "1g" && nextDb["1j"]) turmasAlvo.push("1j");
    if (form.turmaId === "1j" && nextDb["1g"]) turmasAlvo.push("1g");

    const marcarEfetivo = marcarAndamento ?? deveMarcarAndamento(bancoDados[form.turmaId]?.modulos, form.moduloId);
    const moduloNovo = String(form.moduloId).match(/^novo:(\d{4}):(\d)$/);

    turmasAlvo.forEach(tId => {
      if (!nextDb[tId]) return;
      if (!nextDb[tId].modulos) nextDb[tId].modulos = [];
      let moduloDestino;
      if (moduloNovo) {
        const anoN = Number(moduloNovo[1]);
        const bimN = Number(moduloNovo[2]);
        moduloDestino = acharModulo(nextDb[tId].modulos, anoN, bimN);
        if (!moduloDestino) {
          moduloDestino = { id: idModulo(anoN, bimN), titulo: tituloModulo(anoN, bimN), abertoPadrao: false, aulas: [] };
          nextDb[tId].modulos.push(moduloDestino);
          nextDb[tId].modulos = ordenarModulos(nextDb[tId].modulos);
        }
      } else {
        moduloDestino = nextDb[tId].modulos.find(m => m.id === form.moduloId);
      }
      if (!moduloDestino) return;
      if (marcarEfetivo) {
        nextDb[tId].modulos.forEach(m => { m.abertoPadrao = (m === moduloDestino); });
      }

      if (form.id) {
        const indexExistente = moduloDestino.aulas.findIndex(a => a.id === form.id);
        if (indexExistente >= 0) {
          moduloDestino.aulas[indexExistente] = novaAula;
        } else {
          nextDb[tId].modulos.forEach(mod => {
            mod.aulas = mod.aulas.filter(a => a.id !== form.id);
          });
          moduloDestino.aulas.push(novaAula);
        }
      } else {
        moduloDestino.aulas.push(novaAula);
      }

      nextDb[tId].ultimaAtualizacao = new Date().toISOString();
    });
    
    try {
      await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
      setBancoDados(nextDb);
      setFormAberto(false);
      setToast({ mensagem: "Aula gravada e sincronizada com sucesso!" });
    } catch (error) {
      alert("Erro de permissão ao salvar os dados.");
    } finally {
      setSalvando(false);
      setStatusEnvio("");
    }
  };

  const excluirAula = async () => {
    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    const turmasAlvo = [excluindo.turmaId];
    if (excluindo.turmaId === "2h" && nextDb["2l"]) turmasAlvo.push("2l");
    if (excluindo.turmaId === "2l" && nextDb["2h"]) turmasAlvo.push("2h");
    if (excluindo.turmaId === "1g" && nextDb["1j"]) turmasAlvo.push("1j");
    if (excluindo.turmaId === "1j" && nextDb["1g"]) turmasAlvo.push("1g");

    turmasAlvo.forEach(tId => {
      const modulo = nextDb[tId]?.modulos?.find(m => m.id === excluindo.moduloId);
      if (modulo) {
        modulo.aulas = modulo.aulas.filter(a => a.id !== excluindo.aulaId);
        nextDb[tId].ultimaAtualizacao = new Date().toISOString();
      }
    });

    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setExcluindo(null);
    setToast({ mensagem: "Aula removida com sucesso." });
  };

  // ─── LISTAGEM DE AULAS SEM DUPLICATAS VISUAIS ───
  const todasAsAulas = useMemo(() => {
    if (!bancoDados) return [];
    let lista = [];
    const turmasExibir = Object.keys(bancoDados).filter(id => id !== "2l" && id !== "1j");

    turmasExibir.forEach(turmaId => {
      const turmaInfo = bancoDados[turmaId];
      turmaInfo.modulos?.forEach(modulo => {
        modulo.aulas?.forEach(aula => {
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

  // ─── FILTRO DE TURMAS NO TOPO (AGRUPADAS E SEM ZEROS DUPLICADOS) ───
  const listaTurmasFormatada = useMemo(() => {
    if (!bancoDados) return [];
    const turmasFiltradas = Object.entries(bancoDados).filter(([id]) => id !== "2l" && id !== "1j");

    return turmasFiltradas.map(([id, info]) => {
      const totalAulas = info.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
      return { id, nome: info.nome, disciplina: info.disciplina, totalAulas };
    });
  }, [bancoDados]);

  // ─── FILTRAGEM (TURMA, BIMESTRE, BUSCA) ───
  const aulasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const buscando = termo !== "";

    return todasAsAulas.filter(aula => {
      const matchTurma = buscando || filtroTurma === "todas" || aula.turmaId === filtroTurma;
      const matchBimestre = buscando || filtroBimestre === "todos" || aula.moduloId === filtroBimestre;

      const matchBusca = !termo || 
        aula.titulo?.toLowerCase().includes(termo) ||
        aula.numeroAula?.toLowerCase().includes(termo) ||
        aula.semana?.toLowerCase().includes(termo) ||
        aula.introducao?.toLowerCase().includes(termo) ||
        aula.disciplina?.toLowerCase().includes(termo) ||
        aula.nomeTurma?.toLowerCase().includes(termo);

      return matchTurma && matchBimestre && matchBusca;
    }).sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  }, [todasAsAulas, filtroTurma, filtroBimestre, busca]);

  // ─── PAGINAÇÃO (ENCURTA A PÁGINA) ───
  const totalPaginas = Math.ceil(aulasFiltradas.length / itensPorPagina) || 1;
  const aulasPaginadas = useMemo(() => {
    if (itensPorPagina === 999) return aulasFiltradas;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return aulasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [aulasFiltradas, paginaAtual, itensPorPagina]);

  const bimestresDisponiveis = useMemo(() => {
    if (!bancoDados) return [];
    const setBim = new Map();
    Object.values(bancoDados).forEach(turma => {
      turma.modulos?.forEach(m => {
        if (!setBim.has(m.id)) {
          setBim.set(m.id, m.titulo);
        }
      });
    });
    return Array.from(setBim.entries()).map(([id, titulo]) => ({ id, titulo })).sort((x, y) => chaveModulo(x) - chaveModulo(y));
  }, [bancoDados]);

  if (!autenticado || !bancoDados) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950 font-bold text-stone-700 dark:text-slate-300">Verificando credenciais...</div>;

  return (
    <div className="animate-fade-in bg-stone-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300">
      {toast && <Toast mensagem={toast.mensagem} onClose={() => setToast(null)} />}
      {excluindo && <ModalConfirmar onConfirmar={excluirAula} onCancelar={() => setExcluindo(null)} />}

      {/* MODAL DE GERENCIAMENTO E UNIÃO DE TURMAS */}
      {modalTurmas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500"/> Gerenciar & Unir Turmas
              </h3>
              <button onClick={() => setModalTurmas(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              <div className="bg-stone-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-stone-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Criar Nova Turma</h4>
                
                {/* OPÇÃO DE TURMA UNIDA OU TURMA ÚNICA */}
                <div className="flex gap-2 mb-4 bg-white dark:bg-slate-900 p-1 rounded-xl border border-stone-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTipoCriacaoTurma("unida")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      tipoCriacaoTurma === "unida" 
                        ? "bg-amber-600 text-white shadow-sm" 
                        : "text-stone-500 hover:text-stone-800 dark:hover:text-slate-200"
                    }`}
                  >
                    🤝 Unir Turmas do Mesmo Ano (Ex: 3ª Séries A e B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCriacaoTurma("unica")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      tipoCriacaoTurma === "unica" 
                        ? "bg-amber-600 text-white shadow-sm" 
                        : "text-stone-500 hover:text-stone-800 dark:hover:text-slate-200"
                    }`}
                  >
                    👤 Turma Única (Ex: 2ª Série C)
                  </button>
                </div>

                <form onSubmit={handleCriarTurma} className="space-y-3">
                  {tipoCriacaoTurma === "unida" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Ano / Série</label>
                        <select value={novaTurma.ano} onChange={e => setNovaTurma({...novaTurma, ano: e.target.value})} className={inputBaseClass}>
                          <option value="1ª Série">1ª Série (1º Ano)</option>
                          <option value="2ª Série">2ª Série (2º Ano)</option>
                          <option value="3ª Série">3ª Série (3º Ano)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Letras das Séries Unidas</label>
                        <input required placeholder="Ex: H e L  ou  G e J  ou  A e B" value={novaTurma.letras} onChange={e => setNovaTurma({...novaTurma, letras: e.target.value})} className={inputBaseClass} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Nome Completo da Turma</label>
                      <input required placeholder="Ex: 2ª Série C" value={novaTurma.nomePersonalizado} onChange={e => setNovaTurma({...novaTurma, nomePersonalizado: e.target.value})} className={inputBaseClass} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Disciplina</label>
                      <select required value={novaTurma.disciplina} onChange={e => setNovaTurma({...novaTurma, disciplina: e.target.value})} className={inputBaseClass}>
                        <option value="História">História</option>
                        <option value="Desenvolvimento de Sistemas">Desenvolvimento de Sistemas</option>
                        <option value="Carreira e Competências">Carreira e Competências</option>
                        <option value="Lógica de Programação">Lógica de Programação</option>
                        <option value="Outra">+ Outra Disciplina</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">ID da Rota (URL)</label>
                      <input required placeholder="Ex: 3ab  ou  2c-dev" value={novaTurma.idCurto} onChange={e => setNovaTurma({...novaTurma, idCurto: e.target.value})} className={inputBaseClass} />
                    </div>
                  </div>

                  {novaTurma.disciplina === "Outra" && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Nome da Disciplina</label>
                      <input required placeholder="Ex: Programação Web" value={novaTurma.disciplinaOutra} onChange={e => setNovaTurma({...novaTurma, disciplinaOutra: e.target.value})} className={inputBaseClass} />
                    </div>
                  )}

                  <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-amber-600/20">
                    <Plus className="w-4 h-4"/> Salvar Turma
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Turmas Ativas no Sistema</h4>
                <div className="space-y-2.5">
                  {Object.entries(bancoDados).map(([id, info]) => {
                    const total = info.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
                    return (
                      <div key={id} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl gap-2">
                        <div className="min-w-0">
                          <div className="font-black text-xs sm:text-sm text-stone-800 dark:text-slate-100 truncate">
                            {info.nome} <span className="text-[10px] font-bold text-stone-400">({id})</span>
                          </div>
                          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
                            {info.disciplina} • <span className="text-stone-400 dark:text-slate-500">{total} aula(s)</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => { if(window.confirm(`CUIDADO: Excluir a turma "${info.nome}" apagará TODAS as aulas vinculadas a ela. Confirmar exclusão?`)) handleExcluirTurma(id) }} 
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors shrink-0" 
                          title="Excluir Turma"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVISO */}
      {modalAviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500"/> Gerenciar Avisos
              </h3>
              <button onClick={() => setModalAviso(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Para quem é este aviso?</label>
                <select 
                  value={formAviso.alvo} 
                  onChange={(e) => carregarAvisoParaAlvo(e.target.value, todosAvisos)} 
                  className={inputBaseClass}
                >
                  <option value="global">🌍 Todas as Turmas (Global)</option>
                  {Object.entries(bancoDados || {}).filter(([id]) => id !== "2l" && id !== "1j").map(([id, info]) => (
                    <option key={id} value={id}>🎯 Apenas {info.nome} ({info.disciplina})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'comunicado'})} className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all ${formAviso.tipo==='comunicado' ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 shadow-sm' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Megaphone className="w-4 h-4"/> Comunicado</button>
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'parabens'})} className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all ${formAviso.tipo==='parabens' ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 shadow-sm' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Trophy className="w-4 h-4"/> Parabéns</button>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Mensagem</label>
                <textarea rows={4} value={formAviso.mensagem} onChange={e => setFormAviso({...formAviso, mensagem: e.target.value})} placeholder="Escreva o aviso aqui..." className="w-full p-3 sm:p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none text-xs sm:text-sm transition-colors"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Fechar em (Segundos)</label>
                  <input type="number" min="0" value={formAviso.duracao} onChange={e => setFormAviso({...formAviso, duracao: Number(e.target.value)})} className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/50 outline-none text-xs sm:text-sm transition-colors" placeholder="Ex: 5 (0 = fixo)"/>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Status do Aviso</label>
                  <div className={`w-full p-3 rounded-2xl font-bold text-xs sm:text-sm text-center border ${todosAvisos?.[formAviso.alvo]?.ativo ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700'}`}>{todosAvisos?.[formAviso.alvo]?.ativo ? '✅ Publicado agora' : '⏸️ Não publicado'}</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-3 border-t border-stone-100 dark:border-slate-800">
                <button onClick={() => setModalAviso(false)} className="flex-1 py-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold hover:bg-stone-200 dark:hover:bg-slate-700 text-xs sm:text-sm transition-colors">Fechar</button>
                {todosAvisos?.[formAviso.alvo]?.ativo && (
                  <button onClick={() => salvarAviso(false)} disabled={salvandoAviso} className="flex-1 py-3 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200 font-bold hover:bg-stone-300 dark:hover:bg-slate-600 disabled:opacity-50 text-xs sm:text-sm transition-colors">Ocultar aviso</button>
                )}
                <button onClick={() => salvarAviso(true)} disabled={salvandoAviso || !formAviso.mensagem.trim()} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 text-xs sm:text-sm transition-all shadow-md"><Megaphone className="w-4 h-4"/> {salvandoAviso ? 'Salvando...' : 'Publicar aviso'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DO PAINEL */}
      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 p-4 sm:p-6 mb-6 sm:mb-8 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-stone-800 dark:text-slate-100 truncate">Painel do Professor</h1>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-semibold truncate">Chronos Academy</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={gerarNovaMensagem} disabled={gerandoMensagem} title="Gerar uma nova mensagem motivacional agora (normalmente ela se renova sozinha a cada 7 dias)" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors">
              <Sparkles className="w-4 h-4"/> <span className="hidden md:inline">{gerandoMensagem ? "Gerando..." : "Nova mensagem"}</span>
            </button>
            <a href="/admin/ferramentas" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              <Wrench className="w-4 h-4"/> <span>Prática</span>
            </a>
            <a href="/admin/nomes" title="Nomes na p&aacute;gina inicial" aria-label="Nomes na p&aacute;gina inicial" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              <Users className="w-4 h-4"/> <span className="hidden sm:inline">Nomes</span>
            </a>
            <button onClick={handleLogout} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4"/> <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {!formAberto ? (
          <>
            {/* TOPO: TÍTULO E AÇÕES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0"/> 
                  <span>Gerenciador de Aulas</span>
                </h2>
                <p className="text-xs font-semibold text-stone-400 dark:text-slate-500 mt-1">
                  Exibindo {aulasPaginadas.length} de {aulasFiltradas.length} aula(s) filtrada(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={abrirModalAviso} className="flex-1 sm:flex-none justify-center bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs sm:text-sm"><Megaphone className="w-4 h-4 text-amber-500 shrink-0"/> Avisos</button>
                <button onClick={() => setModalTurmas(true)} className="flex-1 sm:flex-none justify-center bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-xs sm:text-sm"><Settings className="w-4 h-4 shrink-0"/> Turmas</button>
                <button onClick={abrirNovoForm} className="w-full sm:w-auto justify-center bg-amber-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors text-xs sm:text-sm"><Plus className="w-4 h-4 shrink-0"/> Nova Aula</button>
              </div>
            </div>

            {/* ─── FILTROS DE TURMAS ─── */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFiltroTurma("todas")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  filtroTurma === "todas"
                    ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20"
                    : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Todas as Turmas</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filtroTurma === "todas" ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"}`}>
                  {todasAsAulas.length}
                </span>
              </button>

              {listaTurmasFormatada.map(turma => {
                const ativa = filtroTurma === turma.id;
                return (
                  <button
                    key={turma.id}
                    onClick={() => setFiltroTurma(turma.id)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      ativa
                        ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20"
                        : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{turma.nome}</span>
                    <span className="text-[10px] opacity-75 font-normal">({turma.disciplina.split(' ')[0]})</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${ativa ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400"}`}>
                      {turma.totalAulas}
                    </span>
                  </button>
                );
              })}
            </div>

            {filtroTurma !== "todas" && bancoDados[filtroTurma] && (
              <div className="flex flex-wrap items-center justify-between gap-2 -mt-2 mb-4 px-1">
                <span className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0"/>
                  {bancoDados[filtroTurma].ultimaAtualizacao
                    ? `Última atualização: ${formatarAtualizacao(bancoDados[filtroTurma].ultimaAtualizacao)}`
                    : "Nenhuma atualização registrada ainda"}
                </span>
                <a href={`/turma/${filtroTurma}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3 shrink-0"/> Ver como aluno
                </a>
              </div>
            )}

            {/* ─── BUSCA, BIMESTRE E VISUALIZAÇÃO COMPACTA ─── */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Pesquisar por aula, assunto, semana ou conteúdo..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                {busca && (
                  <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroBimestre}
                  onChange={e => setFiltroBimestre(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs font-bold text-stone-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="todos">Todos os Bimestres</option>
                  {bimestresDisponiveis.map(b => (
                    <option key={b.id} value={b.id}>{b.titulo}</option>
                  ))}
                </select>

                <div className="flex bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setModoVisualizacao("grade")}
                    className={`p-1.5 rounded-lg transition-colors ${modoVisualizacao === "grade" ? "bg-amber-600 text-white" : "text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"}`}
                    title="Visualização em Grade de Cards"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModoVisualizacao("compacto")}
                    className={`p-1.5 rounded-lg transition-colors ${modoVisualizacao === "compacto" ? "bg-amber-600 text-white" : "text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"}`}
                    title="Visualização em Lista Compacta"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── LISTAGEM DAS AULAS ─── */}
            {aulasFiltradas.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center my-6 shadow-sm">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-stone-300 dark:text-slate-700" />
                <h3 className="text-sm sm:text-base font-bold text-stone-700 dark:text-slate-300">Nenhuma aula encontrada</h3>
                <p className="text-xs text-stone-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Ajuste a pesquisa ou selecione outra turma/bimestre acima.
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
            ) : modoVisualizacao === "grade" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {aulasPaginadas.map(aula => {
                  const qtdVideos = aula.videos?.length || (aula.video?.videoId ? 1 : 0);
                  const qtdPdfs = aula.pdfs?.length || (aula.pdf?.url ? 1 : 0);
                  const temTexto = !!aula.materialTexto;

                  return (
                    <div key={aula.id} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-black uppercase bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded text-stone-600 dark:text-slate-300">
                            {aula.nomeTurma}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                            {aula.nomeModulo}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500 whitespace-nowrap ml-auto">
                          {aula.semana || "—"}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                          {aula.numeroAula || "Aula"}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-stone-800 dark:text-slate-100 leading-snug break-words">
                          {aula.titulo}
                        </h3>
                      </div>

                      {aula.introducao && (
                        <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
                          {aula.introducao}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-2 border-t border-stone-100 dark:border-slate-800/60 text-[10px] sm:text-[11px] text-stone-400 dark:text-slate-500 font-semibold">
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
                          className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
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
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-slate-800">
                {aulasPaginadas.map(aula => {
                  const qtdVideos = aula.videos?.length || (aula.video?.videoId ? 1 : 0);
                  const qtdPdfs = aula.pdfs?.length || (aula.pdf?.url ? 1 : 0);
                  return (
                    <div key={aula.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{aula.numeroAula || "Aula"}</span>
                          <span className="text-[10px] font-black uppercase bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded text-stone-600 dark:text-slate-300">{aula.nomeTurma}</span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500">{aula.nomeModulo} • {aula.semana || '—'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-800 dark:text-slate-100 truncate">{aula.titulo}</h4>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-stone-400 mr-2 font-semibold">
                          {qtdVideos > 0 && <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 px-1.5 py-0.5 rounded">{qtdVideos} V</span>}
                          {qtdPdfs > 0 && <span className="bg-red-50 dark:bg-red-950/40 text-red-700 px-1.5 py-0.5 rounded">{qtdPdfs} PDF</span>}
                        </div>
                        <button onClick={() => editarAula(aula, aula.turmaId, aula.moduloId)} className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-700 text-xs font-bold flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> Editar</button>
                        <button onClick={() => setExcluindo({ aulaId: aula.id, turmaId: aula.turmaId, moduloId: aula.moduloId })} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-500 hover:bg-red-100" title="Excluir"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── BARRA DE PAGINAÇÃO ─── */}
            {aulasFiltradas.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-stone-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  <span>Itens por página:</span>
                  <select 
                    value={itensPorPagina} 
                    onChange={e => setItensPorPagina(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                  >
                    <option value={6}>6 aulas</option>
                    <option value={12}>12 aulas</option>
                    <option value={999}>Todas</option>
                  </select>
                </div>

                {itensPorPagina !== 999 && totalPaginas > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 font-bold transition-colors"
                      title="Página Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-xs font-bold text-stone-600 dark:text-slate-300 px-2">
                      Página {paginaAtual} de {totalPaginas}
                    </span>

                    <button
                      onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 font-bold transition-colors"
                      title="Próxima Página"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6 sm:mb-8 border-b border-stone-100 dark:border-slate-800 pb-4 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-slate-100">{form.id ? "Editar Aula" : "Publicar Nova Aula"}</h2>
                {form.turmaId && bancoDados[form.turmaId] && (
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0"/>
                      {bancoDados[form.turmaId].ultimaAtualizacao
                        ? `Turma atualizada ${formatarAtualizacao(bancoDados[form.turmaId].ultimaAtualizacao)}`
                        : "Turma ainda sem atualizações registradas"}
                    </span>
                    <a href={`/turma/${form.turmaId}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3 shrink-0"/> Ver como aluno
                    </a>
                  </div>
                )}
              </div>
              <button onClick={() => !salvando && setFormAberto(false)} disabled={salvando} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors shrink-0 disabled:opacity-50"><X className="w-4 h-4"/></button>
            </div>
            
            <form onSubmit={salvarAula} className="space-y-6 sm:space-y-8">
              <div className="bg-stone-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-slate-800">
                <h3 className="text-xs sm:text-sm font-black text-stone-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Informações Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Turma de Destino</label>
                    <select 
                      disabled={salvando}
                      value={form.turmaId} 
                      onChange={e => {
                        const newTurmaId = e.target.value;
                        const newModuloId = moduloPadraoId(bancoDados[newTurmaId]?.modulos);
                        setForm({...form, turmaId: newTurmaId, moduloId: newModuloId});
                      }} 
                      className={`${inputBaseClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {listaTurmasFormatada.map(t => <option key={t.id} value={t.id}>{t.nome} - {t.disciplina}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Bimestre / Módulo</label>
                    <select disabled={salvando} value={form.moduloId} onChange={e => setForm({...form, moduloId: e.target.value})} className={`${inputBaseClass} disabled:opacity-60 disabled:cursor-not-allowed`}>
                      {[...new Set(opcoesModulos(bancoDados[form.turmaId]?.modulos, new Date().getFullYear()).map(o => o.ano))].map(anoOp => (
                        <optgroup key={anoOp} label={String(anoOp)}>
                          {opcoesModulos(bancoDados[form.turmaId]?.modulos, new Date().getFullYear()).filter(o => o.ano === anoOp).map(o => (
                            <option key={o.valor} value={o.valor}>{o.rotulo}{o.andamento ? ' (em andamento)' : ''}{o.novo ? ' (novo)' : ''}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <label className="mt-2 flex items-start gap-2 text-xs font-bold text-stone-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={salvando}
                        checked={marcarAndamento ?? deveMarcarAndamento(bancoDados[form.turmaId]?.modulos, form.moduloId)}
                        onChange={e => setMarcarAndamento(e.target.checked)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span>Definir como bimestre em andamento<span className="block font-medium text-stone-400 dark:text-slate-500">Os alunos veem em destaque até você passar para o próximo.</span></span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Identificação da Aula</label>
                    <input required disabled={salvando} value={form.numeroAula} onChange={e => setForm({...form, numeroAula: e.target.value})} placeholder="Ex: Aula 01" className={`${inputBaseClass} disabled:opacity-60 disabled:cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Semana de Referência</label>
                    <input required disabled={salvando} value={form.semana} onChange={e => setForm({...form, semana: e.target.value})} placeholder="Ex: 1ª Semana de Agosto de 2026" className={`${inputBaseClass} disabled:opacity-60 disabled:cursor-not-allowed`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">Assunto / Título da Aula</label>
                    <input required disabled={salvando} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ex: A Greve Geral de 1917" className={`${inputBaseClass} disabled:opacity-60 disabled:cursor-not-allowed`} />
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 uppercase mb-3 flex items-center gap-2"><Target className="w-4 h-4"/> O que é isso?</h3>
                  <textarea required disabled={salvando} rows={4} value={form.introducao} onChange={e => setForm({...form, introducao: e.target.value})} placeholder="Introdução direta..." className={`${inputBaseClass} resize-none disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 uppercase mb-3 flex items-center gap-2"><Rocket className="w-4 h-4"/> Para que serve?</h3>
                  <textarea required disabled={salvando} rows={4} value={form.utilidade} onChange={e => setForm({...form, utilidade: e.target.value})} placeholder="A utilidade prática..." className={`${inputBaseClass} resize-none disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs sm:text-sm font-black text-stone-400 dark:text-slate-500 uppercase flex items-center gap-2"><Video className="w-4 h-4"/> Vídeo(s) (YouTube)</h3>
                    <button type="button" disabled={salvando} onClick={addVideo} className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-700 transition-colors disabled:opacity-50"><Plus className="w-3 h-3"/> Novo Vídeo</button>
                  </div>
                  <div className="space-y-3">
                    {form.videos.map((vid, idx) => (
                      <div key={idx} className="flex gap-2 items-start relative bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-800">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <input disabled={salvando} value={vid.videoId} onChange={e => updateVideo(idx, 'videoId', e.target.value)} placeholder="ID Youtube (Ex: 9EfJyt5HJU0)" className={`${inputBaseClass} font-mono text-xs py-2 disabled:opacity-60`} />
                          </div>
                          <div>
                            <input disabled={salvando} value={vid.duracao} onChange={e => updateVideo(idx, 'duracao', e.target.value)} placeholder="Duração (15:30)" className={`${inputBaseClass} text-xs py-2 disabled:opacity-60`} />
                          </div>
                        </div>
                        {form.videos.length > 1 && (
                          <button type="button" disabled={salvando} onClick={() => removeVideo(idx)} className="mt-1 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors shrink-0 disabled:opacity-50" title="Remover vídeo"><Trash2 className="w-4 h-4"/></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" disabled={salvando} onClick={abrirSugestoesVideos} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/70 disabled:opacity-50 transition-colors">
                    <Search className="w-4 h-4"/> Sugerir vídeos no YouTube (em português)
                  </button>
                  {sugestoesVideos && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
                      <div className="flex gap-2">
                        <input value={buscaVideo} onChange={e => setBuscaVideo(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); buscarVideosYoutube(); } }} placeholder="O que buscar? (ex.: Era Vargas)" className={`${inputBaseClass} text-xs py-2`} />
                        <button type="button" onClick={() => buscarVideosYoutube()} disabled={sugestoesVideos.carregando} className="px-3 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 shrink-0">Buscar</button>
                        <button type="button" onClick={() => setSugestoesVideos(null)} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 rounded-lg shrink-0" title="Fechar sugestões"><X className="w-4 h-4"/></button>
                      </div>
                      {sugestoesVideos.carregando && <p className="text-xs font-bold text-stone-400 dark:text-slate-500">Buscando vídeos em português{buscaVideo.trim() ? "..." : " (a IA está lendo a aula para escolher os melhores)..."}</p>}
                      {sugestoesVideos.erro && <p className="text-xs font-bold text-red-600 dark:text-red-400">{sugestoesVideos.erro}</p>}
                      {!sugestoesVideos.carregando && !sugestoesVideos.erro && sugestoesVideos.aviso && (
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{sugestoesVideos.aviso}</p>
                      )}
                      {!sugestoesVideos.carregando && !sugestoesVideos.erro && sugestoesVideos.buscou && sugestoesVideos.itens.length === 0 && !sugestoesVideos.aviso && (
                        <p className="text-xs font-bold text-stone-400 dark:text-slate-500">Nenhum vídeo encontrado. Tente outras palavras.</p>
                      )}
                      {!sugestoesVideos.carregando && sugestoesVideos.ia && sugestoesVideos.itens.length > 0 && (
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3"/> Escolhidos pela IA com base na aula</p>
                      )}
                      {sugestoesVideos.itens.map(v => {
                        const jaTem = form.videos.some(x => x.videoId === v.videoId);
                        return (
                          <div key={v.videoId} className="flex gap-3 items-start">
                            <img src={v.miniatura} alt="" loading="lazy" className="w-28 h-16 object-cover rounded-lg bg-stone-200 dark:bg-slate-800 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p title={v.titulo} className="text-xs font-bold text-stone-800 dark:text-slate-100 line-clamp-2">{v.titulo}</p>
                              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">{v.canal} · {v.duracao}{v.visualizacoes > 0 ? ` · ${v.visualizacoes.toLocaleString("pt-BR")} visualizações` : ""}</p>
                              {v.motivo && <p className="text-[11px] italic text-indigo-600 dark:text-indigo-400 mt-0.5">{v.motivo}</p>}
                              <div className="flex gap-2 mt-1.5">
                                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 text-[11px] font-bold text-stone-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Assistir</a>
                                <button type="button" disabled={jaTem} onClick={() => usarVideoSugerido(v)} className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors">{jaTem ? "Adicionado" : "Usar"}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs sm:text-sm font-black text-stone-400 dark:text-slate-500 uppercase flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Material PDF</h3>
                    <label className={`text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-700 transition-colors cursor-pointer ${salvando ? "opacity-50 pointer-events-none" : ""}`}>
                      <Plus className="w-3 h-3"/> Novo anexo
                      <input type="file" multiple accept="application/pdf" disabled={salvando} className="hidden" onChange={e => { adicionarAnexos(Array.from(e.target.files)); e.target.value = ""; }} />
                    </label>
                  </div>
                  <div className="space-y-3 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-stone-300 dark:border-slate-700">
                    {form.pdfs.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest border-b border-stone-100 dark:border-slate-800 pb-1">Arquivos salvos</p>
                        {form.pdfs.map((pdf, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-stone-50 dark:bg-slate-950 border border-stone-100 dark:border-slate-800 p-2 rounded-lg gap-2">
                            {totalAnexos > 1 && (
                              <input type="checkbox" title="A IA vai ler este arquivo" checked={!iaExcluidos[chaveSalvoPdf(pdf)]} onChange={() => alternarIA(chaveSalvoPdf(pdf))} className="accent-indigo-600 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate flex-1">{pdf.titulo}</span>
                            <button type="button" disabled={salvando} onClick={() => removePdfAntigo(idx)} className="text-stone-300 dark:text-slate-600 hover:text-red-500 p-1 rounded transition-colors shrink-0 disabled:opacity-50" title="Apagar anexo"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {arquivosPdf.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-stone-100 dark:border-slate-800 pb-1">Novos anexos (enviados ao publicar)</p>
                        {arquivosPdf.map((f, idx) => (
                          <div key={chaveNovoPdf(f)} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-2 rounded-lg gap-2">
                            {totalAnexos > 1 && (
                              <input type="checkbox" title="A IA vai ler este arquivo" checked={!iaExcluidos[chaveNovoPdf(f)]} onChange={() => alternarIA(chaveNovoPdf(f))} className="accent-indigo-600 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate flex-1">{f.name}</span>
                            <button type="button" disabled={salvando} onClick={() => removerAnexoNovo(idx)} className="text-stone-300 dark:text-slate-600 hover:text-red-500 p-1 rounded transition-colors shrink-0 disabled:opacity-50" title="Remover anexo"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {totalAnexos === 0 && (
                      <p className="text-xs text-stone-400 dark:text-slate-500 text-center py-2">Nenhum anexo ainda. Toque em "+ Novo anexo".</p>
                    )}
                    {totalAnexos > 1 && (
                      <p className="text-[10px] text-stone-400 dark:text-slate-500 font-bold">Marque os PDFs que a IA deve ler (até 5).</p>
                    )}
                    <button 
                      type="button" 
                      onClick={gerarComIA} 
                      disabled={gerandoIA || salvando || qtdAnexosIA === 0} 
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Sparkles className="w-4 h-4"/> {gerandoIA ? "Gerando com IA..." : (qtdAnexosIA > 1 ? `Gerar com IA (a partir de ${qtdAnexosIA} PDFs)` : "Gerar com IA (a partir do PDF)")}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-xs sm:text-sm font-black text-stone-400 dark:text-slate-500 uppercase mb-3 flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Resumo em Texto (Opcional)</h3>
                  <textarea rows={5} disabled={salvando} value={form.materialTexto} onChange={e => setForm({...form, materialTexto: e.target.value})} placeholder="Digite as anotações..." className={`${inputBaseClass} resize-y disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs sm:text-sm font-black text-stone-400 dark:text-slate-500 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4"/> Material de Estudo com IA (Opcional)</h3>
                  <div className="space-y-2 p-4 rounded-2xl border border-dashed border-stone-300 dark:border-slate-700">
                    <p className="text-xs text-stone-500 dark:text-slate-400">A IA lê os PDFs marcados acima (e/ou o texto colado aqui) e monta um material de estudo em linguagem simples, com palavras-chave. Ela só usa o que está no material; o que ela acrescentar aparece em amarelo para você conferir antes de publicar. Para PowerPoint, salve como PDF antes.</p>
                    <input disabled={salvando || gerandoMaterial} value={prioridadesIA} onChange={e => setPrioridadesIA(e.target.value)} placeholder="Tópicos prioritários desta aula (opcional). Ex.: causas da Revolução Industrial; máquina a vapor" className={inputBaseClass} />
                    <textarea rows={3} disabled={salvando || gerandoMaterial} value={textoColadoIA} onChange={e => setTextoColadoIA(e.target.value)} placeholder="Ou cole aqui o texto do material (opcional)..." className={`${inputBaseClass} resize-y`} />
                    <button
                      type="button"
                      onClick={gerarMaterialEstudo}
                      disabled={gerandoMaterial || salvando || carregandoMaterial || (qtdAnexosIA === 0 && !textoColadoIA.trim())}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {gerandoMaterial
                        ? <><Loader2 className="w-4 h-4 animate-spin"/> Gerando material (pode levar até 1 minuto)...</>
                        : <><Sparkles className="w-4 h-4"/> {form.materialEstudo ? "Gerar o material de novo" : "Gerar material de estudo"}</>}
                    </button>
                  </div>
                  {carregandoMaterial && (
                    <p className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Carregando o material de estudo desta aula...</p>
                  )}
                  {form.materialEstudoErro && (
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Não foi possível carregar o material de estudo desta aula agora. Ele continua salvo e publicado; feche e abra a aula de novo para editar.</p>
                  )}
                  {form.materialEstudo && (
                    <RevisaoMaterial
                      material={form.materialEstudo}
                      onChange={m => setForm(prev => ({ ...prev, materialEstudo: m }))}
                      onRemover={removerMaterialEstudo}
                      disabled={salvando || gerandoMaterial}
                      inputClass={inputBaseClass}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setFormAberto(false)} 
                  disabled={salvando} 
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvando} 
                  className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-amber-600 shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm transition-all"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{statusEnvio || "Enviando..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{form.id ? "Salvar Alterações" : "Publicar Aula"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}