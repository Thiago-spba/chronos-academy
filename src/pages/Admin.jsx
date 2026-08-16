import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Edit3, Trash2, X, Save, LogOut, GraduationCap, AlertTriangle, CheckCircle2, Video, FileText, AlignLeft, Target, Rocket, UploadCloud } from "lucide-react";

import { db, auth, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const turmasIniciais = {
  "2h": { nome: "2ª Série H", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2l": { nome: "2ª Série L", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "1g": { nome: "1ª Série G", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "1j": { nome: "1ª Série J", disciplina: "História", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-dev": { nome: "2ª Série C", disciplina: "Desenvolvimento de Sistemas", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] },
  "2c-carr": { nome: "2ª Série C", disciplina: "Carreira e Competências", modulos: [{ id: "b3", titulo: "3º Bimestre", abertoPadrao: true, aulas: [] }] }
};

function gerarId() { return "aula_" + Date.now().toString(36); }

function Toast({ mensagem, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 animate-slide-up">
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
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
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
  const navigate = useNavigate();
  const [bancoDados, setBancoDados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState({
    id: "", turmaId: "2h", numeroAula: "", titulo: "", semana: "",
    introducao: "", utilidade: "", videoId: "", duracao: "", materialTexto: "", pdf: null
  });

  const inputBaseClass = "w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-indigo-500/50 outline-none transition-colors duration-300";

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
        setBancoDados(docSnap.data());
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

  const abrirNovoForm = () => {
    setForm({ id: "", turmaId: "2h", numeroAula: "", titulo: "", semana: "", introducao: "", utilidade: "", videoId: "", duracao: "", materialTexto: "", pdf: null });
    setArquivoPdf(null);
    setFormAberto(true);
  };

  const editarAula = (aula, turmaId) => {
    setForm({
      id: aula.id, turmaId, numeroAula: aula.numeroAula || "", titulo: aula.titulo, semana: aula.semana || "", introducao: aula.introducao || "", utilidade: aula.utilidade || "",
      videoId: aula.video?.videoId || "", duracao: aula.video?.duracao || "", materialTexto: aula.materialTexto || "", pdf: aula.pdf || null
    });
    setArquivoPdf(null);
    setFormAberto(true);
  };

  const salvarAula = async (e) => {
    e.preventDefault();
    setSalvando(true);
    
    let pdfData = form.pdf;

    if (arquivoPdf) {
      try {
        const fileRef = ref(storage, `chronos_pdfs/${Date.now()}_${arquivoPdf.name}`);
        await uploadBytes(fileRef, arquivoPdf);
        const url = await getDownloadURL(fileRef);
        const tamanhoMB = (arquivoPdf.size / (1024 * 1024)).toFixed(2) + " MB";
        pdfData = { titulo: arquivoPdf.name, url: url, tamanho: tamanhoMB };
      } catch (error) {
        console.error("Erro no upload", error);
        alert("Ocorreu um erro ao enviar o PDF. Verifique se o arquivo não é muito grande.");
        setSalvando(false);
        return;
      }
    }

    const novaAula = {
      id: form.id || gerarId(), numeroAula: form.numeroAula, titulo: form.titulo, semana: form.semana, introducao: form.introducao, utilidade: form.utilidade,
      video: form.videoId ? { videoId: form.videoId, duracao: form.duracao } : null,
      pdf: pdfData, materialTexto: form.materialTexto || null
    };

    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    const modulo = nextDb[form.turmaId].modulos.find(m => m.id === "b3");
    
    if (form.id) {
      const idx = modulo.aulas.findIndex(a => a.id === form.id);
      if (idx >= 0) modulo.aulas[idx] = novaAula;
    } else {
      modulo.aulas.push(novaAula);
    }
    
    try {
      await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
      setBancoDados(nextDb);
      setFormAberto(false);
      setToast({ mensagem: form.id ? "Aula atualizada!" : "Aula publicada!" });
    } catch (error) {
      alert("Erro de permissão ao salvar os dados.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirAula = async () => {
    const nextDb = JSON.parse(JSON.stringify(bancoDados));
    const modulo = nextDb[excluindo.turmaId].modulos.find(m => m.id === "b3");
    modulo.aulas = modulo.aulas.filter(a => a.id !== excluindo.aulaId);
    await setDoc(doc(db, "chronos", "dados_escola"), nextDb);
    setBancoDados(nextDb);
    setExcluindo(null);
    setToast({ mensagem: "Aula removida." });
  };

  const todasAsAulas = useMemo(() => {
    if (!bancoDados) return [];
    let lista = [];
    Object.entries(bancoDados).forEach(([turmaId, turmaInfo]) => {
      turmaInfo.modulos.forEach(modulo => {
        modulo.aulas.forEach(aula => {
          lista.push({ ...aula, turmaId, nomeTurma: turmaInfo.nome, nomeModulo: modulo.titulo });
        });
      });
    });
    return lista;
  }, [bancoDados]);

  if (!autenticado || !bancoDados) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950 font-bold">Verificando credenciais...</div>;

  return (
    <div className="animate-fade-in bg-stone-50 dark:bg-slate-950 min-h-screen pb-20">
      {toast && <Toast mensagem={toast.mensagem} onClose={() => setToast(null)} />}
      {excluindo && <ModalConfirmar onConfirmar={excluirAula} onCancelar={() => setExcluindo(null)} />}

      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 p-6 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg"><GraduationCap className="w-6 h-6 text-white" /></div>
          <div><h1 className="text-xl font-black text-stone-800 dark:text-slate-100">Painel do Professor</h1></div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-lg text-sm font-bold text-stone-600 hover:text-red-600"><LogOut className="w-4 h-4"/> Sair</button>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {!formAberto ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2"><BookOpen className="w-6 h-6 text-amber-500"/> Aulas Publicadas</h2>
              <button onClick={abrirNovoForm} className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus className="w-5 h-5"/> Criar Nova Aula</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {todasAsAulas.map(aula => (
                <div key={aula.id} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase bg-stone-100 px-2 py-1 rounded text-stone-500">{aula.nomeTurma}</span>
                    <span className="text-xs font-bold text-stone-400">{aula.semana || 'Semana não definida'}</span>
                  </div>
                  <h3 className="text-lg font-black text-stone-800 dark:text-slate-100 mb-1">{aula.numeroAula}</h3>
                  <p className="text-sm font-medium text-stone-600 dark:text-slate-400 mb-4 flex-1">{aula.titulo}</p>
                  <div className="flex gap-2 border-t border-stone-100 pt-4 mt-auto">
                    <button onClick={() => editarAula(aula, aula.turmaId)} className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg bg-stone-50 text-sm font-bold"><Edit3 className="w-4 h-4"/> Editar</button>
                    <button onClick={() => setExcluindo({ aulaId: aula.id, turmaId: aula.turmaId })} className="p-2 rounded-lg bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-2xl font-black text-stone-800 dark:text-slate-100">{form.id ? "Editar Aula" : "Publicar Nova Aula"}</h2>
              <button onClick={() => setFormAberto(false)} className="p-2 bg-stone-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={salvarAula} className="space-y-8">
              <div className="bg-stone-50 p-6 rounded-2xl border">
                <h3 className="text-sm font-black text-stone-400 uppercase mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Informações Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-600 mb-1">Turma de Destino</label>
                    <select value={form.turmaId} onChange={e => setForm({...form, turmaId: e.target.value})} className={inputBaseClass}>
                      {Object.entries(bancoDados).map(([id, info]) => <option key={id} value={id}>{info.nome} - {info.disciplina}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Identificação da Aula</label>
                    <input required value={form.numeroAula} onChange={e => setForm({...form, numeroAula: e.target.value})} placeholder="Ex: Aula 01" className={inputBaseClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Semana de Referência</label>
                    <input required value={form.semana} onChange={e => setForm({...form, semana: e.target.value})} placeholder="Ex: 1ª Semana de Agosto de 2026" className={inputBaseClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-600 mb-1">Assunto / Título da Aula</label>
                    <input required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ex: A Greve Geral de 1917" className={inputBaseClass} />
                  </div>
                </div>
              </div>
              <div className="bg-stone-50 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-black text-amber-600 uppercase mb-4 flex items-center gap-2"><Target className="w-4 h-4"/> O que é isso?</h3>
                  <textarea required rows={4} value={form.introducao} onChange={e => setForm({...form, introducao: e.target.value})} placeholder="Introdução direta..." className={`${inputBaseClass} resize-none`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-600 uppercase mb-4 flex items-center gap-2"><Rocket className="w-4 h-4"/> Para que serve?</h3>
                  <textarea required rows={4} value={form.utilidade} onChange={e => setForm({...form, utilidade: e.target.value})} placeholder="A utilidade prática..." className={`${inputBaseClass} resize-none`} />
                </div>
              </div>
              <div className="bg-stone-50 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-black text-stone-400 uppercase mb-4 flex items-center gap-2"><Video className="w-4 h-4"/> Vídeo (YouTube)</h3>
                  <div className="space-y-3">
                    <input value={form.videoId} onChange={e => setForm({...form, videoId: e.target.value})} placeholder="Apenas o ID (Ex: 9EfJyt5HJU0)" className={`${inputBaseClass} font-mono`} />
                    <input value={form.duracao} onChange={e => setForm({...form, duracao: e.target.value})} placeholder="Duração (Ex: 15:30)" className={inputBaseClass} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-400 uppercase mb-4 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Material PDF</h3>
                  <div className="space-y-3 p-4 bg-white rounded-xl border border-dashed border-stone-300 text-center">
                    {form.pdf && !arquivoPdf && <div className="text-xs text-amber-600 font-bold mb-3 border-b pb-2">Anexo Atual: {form.pdf.titulo}</div>}
                    <input type="file" accept="application/pdf" onChange={e => setArquivoPdf(e.target.files[0])} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
                    <p className="text-[10px] text-stone-400 mt-2">Selecione o arquivo do seu computador</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-black text-stone-400 uppercase mb-4 flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Resumo em Texto (Opcional)</h3>
                  <textarea rows={5} value={form.materialTexto} onChange={e => setForm({...form, materialTexto: e.target.value})} placeholder="Digite as anotações..." className={`${inputBaseClass} resize-y`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setFormAberto(false)} disabled={salvando} className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-8 py-3 rounded-xl font-bold text-white bg-amber-600 shadow-lg flex items-center gap-2 disabled:opacity-50"><Save className="w-5 h-5"/> {salvando ? "Enviando Dados..." : "Publicar Aula"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}