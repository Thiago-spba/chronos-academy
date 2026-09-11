import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Plus, Edit3, Trash2, X, Save, ArrowLeft,
  AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function gerarId() { return 'ferr_' + Date.now().toString(36); }

function Toast({ mensagem, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 animate-slide-up max-w-[90vw] sm:max-w-md">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold break-words">{mensagem}</span>
    </div>
  );
}

function ModalConfirmar({ onConfirmar, onCancelar, titulo }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">Excluir "{titulo}"?</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mb-6 leading-relaxed">
          Essa ferramenta some da página Prática. Não afeta o site original dela, só remove o link daqui.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors">Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFerramentas() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(false);
  const [itens, setItens] = useState(null);
  const [toast, setToast] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ id: '', titulo: '', descricao: '', url: '', ativo: true });

  const inputBaseClass = "w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 outline-none text-xs sm:text-sm transition-colors duration-300";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAutenticado(true);
        carregar();
      } else {
        navigate('/admin');
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function carregar() {
    try {
      const snap = await getDoc(doc(db, 'chronos', 'ferramentas'));
      if (snap.exists() && Array.isArray(snap.data().itens)) {
        setItens(snap.data().itens);
      } else {
        setItens([]);
      }
    } catch (e) {
      console.error(e);
      setItens([]);
    }
  }

  async function salvarLista(novaLista) {
    await setDoc(doc(db, 'chronos', 'ferramentas'), { itens: novaLista });
    setItens(novaLista);
  }

  const abrirNovoForm = () => {
    setForm({ id: '', titulo: '', descricao: '', url: '', ativo: true });
    setFormAberto(true);
  };

  const editarItem = (item) => {
    setForm({ ...item });
    setFormAberto(true);
  };

  const salvarForm = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) {
      alert('Preencha pelo menos o título e o link.');
      return;
    }
    setSalvando(true);
    try {
      const novaLista = [...(itens || [])];
      if (form.id) {
        const idx = novaLista.findIndex((i) => i.id === form.id);
        if (idx >= 0) novaLista[idx] = { ...form };
      } else {
        novaLista.push({ ...form, id: gerarId(), ordem: novaLista.length });
      }
      await salvarLista(novaLista);
      setFormAberto(false);
      setToast({ mensagem: 'Ferramenta salva com sucesso!' });
    } catch (e) {
      console.error(e);
      alert('Erro de permissão ao salvar. Confira se você está logado como admin.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirItem = async () => {
    const novaLista = (itens || []).filter((i) => i.id !== excluindo.id);
    await salvarLista(novaLista);
    setExcluindo(null);
    setToast({ mensagem: 'Ferramenta removida.' });
  };

  const alternarAtivo = async (item) => {
    const novaLista = (itens || []).map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i));
    await salvarLista(novaLista);
  };

  const mover = async (index, direcao) => {
    const novaLista = [...itens];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novaLista.length) return;
    [novaLista[index], novaLista[alvo]] = [novaLista[alvo], novaLista[index]];
    const comOrdem = novaLista.map((item, i) => ({ ...item, ordem: i }));
    await salvarLista(comOrdem);
  };

  if (!autenticado || itens === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950 font-bold text-stone-700 dark:text-slate-300">
        Verificando credenciais...
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-stone-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300">
      {toast && <Toast mensagem={toast.mensagem} onClose={() => setToast(null)} />}
      {excluindo && (
        <ModalConfirmar titulo={excluindo.titulo} onConfirmar={excluirItem} onCancelar={() => setExcluindo(null)} />
      )}

      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 p-4 sm:p-6 mb-6 sm:mb-8 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <a href="/admin/painel" className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-600 hover:bg-amber-100 hover:text-amber-700 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-stone-800 dark:text-slate-100 truncate">Ferramentas de Prática</h1>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-semibold truncate">Gerencie os links que aparecem em /pratica</p>
            </div>
          </div>
          <button onClick={abrirNovoForm} className="bg-amber-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors text-xs sm:text-sm shrink-0">
            <Plus className="w-4 h-4 shrink-0" /> Nova Ferramenta
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {formAberto && (
          <form onSubmit={salvarForm} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-stone-800 dark:text-slate-100">{form.id ? 'Editar' : 'Nova'} Ferramenta</h3>
              <button type="button" onClick={() => setFormAberto(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Título</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Simulador de Entrevista" className={inputBaseClass} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Descrição curta</label>
              <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Treine perguntas de entrevista técnica" className={inputBaseClass} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Link (URL completo)</label>
              <input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className={inputBaseClass} />
            </div>
            <button type="submit" disabled={salvando} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-amber-600/20 disabled:opacity-60">
              <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {itens.length === 0 && (
            <p className="text-sm text-stone-400 dark:text-slate-500 text-center py-10">
              Nenhuma ferramenta cadastrada ainda. Clique em "Nova Ferramenta" pra começar.
            </p>
          )}
          {itens.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl">
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => mover(index, -1)} disabled={index === 0} className="p-1 rounded-md text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => mover(index, 1)} disabled={index === itens.length - 1} className="p-1 rounded-md text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-stone-800 dark:text-slate-100 truncate flex items-center gap-2">
                  {item.titulo}
                  {item.ativo === false && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-400">Oculta</span>
                  )}
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline truncate flex items-center gap-1">
                  {item.url} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => alternarAtivo(item)} title={item.ativo === false ? 'Mostrar' : 'Ocultar'} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors">
                  {item.ativo === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => editarItem(item)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => setExcluindo(item)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
