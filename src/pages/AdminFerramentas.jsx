import { useState, useEffect } from 'react';
import BotaoTema from '../components/BotaoTema';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Plus, Edit3, Trash2, X, Save, ArrowLeft,
  AlertTriangle, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink,
  FastForward
} from 'lucide-react';
import { db } from '../firebase';
import { auth } from '../firebaseProfessor';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ANO_LEGADO, idModulo, tituloModulo, ordenarModulos, moduloEmAndamento, lerModulo, opcoesModulos } from '../utils/bimestres';
import SeletorBimestre from '../components/SeletorBimestre';
import { aplicarFerramenta } from '../utils/ferramentas';
import { Toast } from '../components/Notificacao';

function gerarId() { return 'ferr_' + Date.now().toString(36); }

// Le o documento de ferramentas em qualquer um dos dois formatos:
// novo (modulos por bimestre) ou antigo (lista unica "itens", de antes dessa funcionalidade existir).
function lerModulos(data) {
  if (Array.isArray(data?.modulos)) return data.modulos;
  if (Array.isArray(data?.itens)) {
    return [{ id: idModulo(ANO_LEGADO, 3), titulo: tituloModulo(ANO_LEGADO, 3), abertoPadrao: true, itens: data.itens }];
  }
  return [];
}

// Proximo bimestre na sequencia: 1 -> 2 -> 3 -> 4 -> 1 do ano seguinte.
function proximoBimestre(ano, bim) {
  return bim >= 4 ? { ano: ano + 1, bim: 1 } : { ano, bim: bim + 1 };
}

function ModalConfirmar({ onConfirmar, onCancelar, titulo, mensagem, textoBotao, corBotao }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-slate-100">{titulo}</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mb-6 leading-relaxed">
          {mensagem}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
          <button onClick={onConfirmar} className={`flex-1 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-colors ${corBotao || 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'}`}>{textoBotao || 'Excluir'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFerramentas() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(false);
  const [modulos, setModulos] = useState(null);
  const [toast, setToast] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [avancando, setAvancando] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [vistoId, setVistoId] = useState(null);
  const [form, setForm] = useState({ id: '', titulo: '', descricao: '', url: '', ativo: true, destino: '' });

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
      const lidos = snap.exists() ? lerModulos(snap.data()) : [];
      // Migracao automatica: se ainda estava no formato antigo (lista unica), grava ja no novo formato.
      if (snap.exists() && !Array.isArray(snap.data().modulos) && Array.isArray(snap.data().itens)) {
        await setDoc(doc(db, 'chronos', 'ferramentas'), { modulos: lidos });
      }
      setModulos(lidos);
    } catch (e) {
      console.error(e);
      setModulos([]);
    }
  }

  async function salvarModulos(novaLista) {
    await setDoc(doc(db, 'chronos', 'ferramentas'), { modulos: novaLista });
    setModulos(novaLista);
  }

  const ordenados = ordenarModulos(modulos || []);
  const moduloAtivo = moduloEmAndamento(ordenados) || ordenados[ordenados.length - 1] || null;
  // Bimestre que esta aberto na tela para ver/editar (qualquer um; comeca pelo em andamento).
  const moduloVisto = ordenados.find((m) => m.id === vistoId) || moduloAtivo;
  const itens = moduloVisto?.itens || [];
  const anoCalendario = new Date().getFullYear();
  const opcoesBim = opcoesModulos(ordenados, anoCalendario);
  const destinoPadrao = moduloVisto ? moduloVisto.id : 'novo:' + anoCalendario + ':1';

  const abrirNovoForm = () => {
    setForm({ id: '', titulo: '', descricao: '', url: '', ativo: true, destino: destinoPadrao });
    setFormAberto(true);
  };

  const editarItem = (item) => {
    setForm({ ...item, destino: destinoPadrao });
    setFormAberto(true);
  };

  const salvarForm = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) {
      setToast({ mensagem: 'Preencha pelo menos o título e o link.', erro: true });
      return;
    }
    setSalvando(true);
    try {
      const { lista: novosModulos, alvoId } = aplicarFerramenta(ordenados, form, destinoPadrao, anoCalendario, gerarId());
      setVistoId(alvoId);
      await salvarModulos(novosModulos);
      setFormAberto(false);
      setToast({ mensagem: 'Ferramenta salva com sucesso!' });
    } catch (e) {
      console.error(e);
      setToast({ mensagem: 'Erro de permissão ao salvar. Confira se você está logado como admin.', erro: true });
    } finally {
      setSalvando(false);
    }
  };

  const excluirItem = async () => {
    const novaListaItens = itens.filter((i) => i.id !== excluindo.id);
    const novosModulos = ordenados.map((m) => (m.id === moduloVisto.id ? { ...m, itens: novaListaItens } : m));
    await salvarModulos(novosModulos);
    setExcluindo(null);
    setToast({ mensagem: 'Ferramenta removida.' });
  };

  const alternarAtivo = async (item) => {
    const novaListaItens = itens.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i));
    const novosModulos = ordenados.map((m) => (m.id === moduloVisto.id ? { ...m, itens: novaListaItens } : m));
    await salvarModulos(novosModulos);
  };

  const mover = async (index, direcao) => {
    const novaListaItens = [...itens];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novaListaItens.length) return;
    [novaListaItens[index], novaListaItens[alvo]] = [novaListaItens[alvo], novaListaItens[index]];
    const comOrdem = novaListaItens.map((item, i) => ({ ...item, ordem: i }));
    const novosModulos = ordenados.map((m) => (m.id === moduloVisto.id ? { ...m, itens: comOrdem } : m));
    await salvarModulos(novosModulos);
  };

  const confirmarAvancarBimestre = async () => {
    const base = moduloAtivo ? lerModulo(moduloAtivo) : { ano: new Date().getFullYear(), bim: 0 };
    const prox = proximoBimestre(base.ano, base.bim || 1);
    const novoModulo = { id: idModulo(prox.ano, prox.bim), titulo: tituloModulo(prox.ano, prox.bim), abertoPadrao: true, itens: [] };
    const semAndamento = ordenados.map((m) => ({ ...m, abertoPadrao: false }));
    await salvarModulos([...semAndamento, novoModulo]);
    setAvancando(false);
    setToast({ mensagem: `Agora está no ${novoModulo.titulo}. A lista começou vazia.` });
  };

  if (!autenticado || modulos === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950 font-bold text-stone-700 dark:text-slate-300">
        Verificando credenciais...
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-stone-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300">
      {toast && <Toast mensagem={toast.mensagem} erro={toast.erro} onClose={() => setToast(null)} />}
      {excluindo && (
        <ModalConfirmar titulo={`Excluir "${excluindo.titulo}"?`} mensagem="Essa ferramenta some da página Prática. Não afeta o site original dela, só remove o link daqui." onConfirmar={excluirItem} onCancelar={() => setExcluindo(null)} />
      )}
      {avancando && (
        <ModalConfirmar
          titulo="Avançar de bimestre?"
          mensagem={`As ferramentas de "${moduloAtivo ? moduloAtivo.titulo : 'agora'}" ficam guardadas e continuam disponíveis pra quem quiser ver. A lista aqui começa vazia de novo.`}
          textoBotao="Avançar"
          corBotao="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20"
          onConfirmar={confirmarAvancarBimestre}
          onCancelar={() => setAvancando(false)}
        />
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
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-semibold truncate">
                {moduloAtivo ? moduloAtivo.titulo : 'Nenhum bimestre ainda'} · Gerencie os links que aparecem em /pratica
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BotaoTema />
            <button onClick={() => setAvancando(true)} title="Avançar bimestre" className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 px-3 sm:px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors text-xs sm:text-sm">
              <FastForward className="w-4 h-4 shrink-0" /> Avançar bimestre
            </button>
            <button onClick={abrirNovoForm} className="bg-amber-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors text-xs sm:text-sm shrink-0">
              <Plus className="w-4 h-4 shrink-0" /> Nova Ferramenta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {ordenados.length > 1 && !formAberto && (
          <div className="mb-5">
            <SeletorBimestre modulos={ordenados} escolhidoId={moduloVisto?.id} onEscolher={setVistoId} contar={(m) => (m.itens || []).length} />
          </div>
        )}

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
            <div>
              <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1 uppercase">Bimestre</label>
              <select value={form.destino || destinoPadrao} onChange={(e) => setForm({ ...form, destino: e.target.value })} className={inputBaseClass}>
                {opcoesBim.map((o) => (
                  <option key={o.valor} value={o.valor}>{o.rotulo}{o.andamento ? ' (em andamento)' : ''}{o.novo ? ' (novo)' : ''}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={salvando} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-amber-600/20 disabled:opacity-60">
              <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {itens.length === 0 && (
            <p className="text-sm text-stone-400 dark:text-slate-500 text-center py-10">
              Nenhuma ferramenta cadastrada ainda neste bimestre. Clique em "Nova Ferramenta" pra começar.
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
