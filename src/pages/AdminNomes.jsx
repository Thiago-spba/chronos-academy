import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Tela para cadastrar os primeiros nomes que aparecem deslizando na pagina inicial.
// Grava em chronos/nomes_alunos: { ativo, nomes: { turma: [ ... ] }, atualizadoEm }
// Ao salvar, os nomes passam a aparecer. "Remover todos" desliga o efeito.

const TURMAS = [
  { id: '2h', rotulo: '2ª Série H' },
  { id: '2l', rotulo: '2ª Série L' },
  { id: '1g', rotulo: '1ª Série G' },
  { id: '1j', rotulo: '1ª Série J' },
  { id: '2c', rotulo: '2ª Série C' },
];

const MAX_POR_TURMA = 60;

function limpar(texto) {
  const vistos = new Set();
  const lista = [];
  for (const linha of texto.split(/\r?\n|;/)) {
    const nome = linha.trim().replace(/\s+/g, ' ');
    if (!nome || nome.length > 30) continue;
    const chave = nome.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(nome);
  }
  return lista;
}

function Toast({ mensagem, erro, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, erro ? 6000 : 3000); return () => clearTimeout(t); }, [onClose, erro]);
  const cor = erro
    ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
    : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
  return (
    <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg animate-slide-up max-w-[90vw] sm:max-w-md ${cor}`}>
      {erro ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      <span className="text-xs sm:text-sm font-semibold break-words">{mensagem}</span>
    </div>
  );
}

export default function AdminNomes() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [textos, setTextos] = useState({ '2h': '', '2l': '', '1g': '', '1j': '', '2c': '' });
  const [noAr, setNoAr] = useState(0); // quantos nomes estao publicados agora
  const [salvando, setSalvando] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [toast, setToast] = useState(null);

  const inputBaseClass = 'w-full p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 outline-none text-xs sm:text-sm transition-colors duration-300';

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

  const carregar = async () => {
    try {
      const snap = await getDoc(doc(db, 'chronos', 'nomes_alunos'));
      if (snap.exists()) {
        const dados = snap.data();
        const novos = { '2h': '', '2l': '', '1g': '', '1j': '', '2c': '' };
        let total = 0;
        TURMAS.forEach((t) => {
          const lista = Array.isArray(dados.nomes?.[t.id]) ? dados.nomes[t.id] : [];
          novos[t.id] = lista.join('\n');
          total += lista.length;
        });
        setTextos(novos);
        setNoAr(dados.ativo ? total : 0);
      }
    } catch (e) {
      setToast({ mensagem: 'Não consegui ler os nomes salvos.', erro: true });
    } finally {
      setCarregando(false);
    }
  };

  const analise = useMemo(() => {
    const porTurma = {};
    const suspeitos = [];
    let total = 0;
    TURMAS.forEach((t) => {
      const lista = limpar(textos[t.id]);
      porTurma[t.id] = lista;
      total += lista.length;
      lista.forEach((n) => { if (n.split(' ').length >= 3) suspeitos.push(n); });
    });
    const excesso = TURMAS.some((t) => porTurma[t.id].length > MAX_POR_TURMA);
    return { porTurma, total, suspeitos, excesso };
  }, [textos]);

  const importarArquivo = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const dados = JSON.parse(leitor.result);
        const novos = { '2h': [], '2l': [], '1g': [], '1j': [], '2c': [] };
        Object.entries(dados).forEach(([chave, lista]) => {
          if (!Array.isArray(lista)) return;
          const id = chave.startsWith('2c') ? '2c' : chave;
          if (novos[id]) novos[id].push(...lista.filter((n) => typeof n === 'string'));
        });
        setTextos({
          '2h': novos['2h'].join('\n'),
          '2l': novos['2l'].join('\n'),
          '1g': novos['1g'].join('\n'),
          '1j': novos['1j'].join('\n'),
          '2c': novos['2c'].join('\n'),
        });
        setToast({ mensagem: 'Arquivo lido. Confira os nomes e clique em Salvar.' });
      } catch (err) {
        setToast({ mensagem: 'Arquivo inválido. Use o primeiros-nomes.json.', erro: true });
      }
    };
    leitor.readAsText(arquivo, 'utf-8');
  };

  const gravar = async (dados, mensagemOk) => {
    setSalvando(true);
    try {
      await setDoc(doc(db, 'chronos', 'nomes_alunos'), { ...dados, atualizadoEm: new Date().toISOString() });
      setToast({ mensagem: mensagemOk });
      return true;
    } catch (e) {
      const semPermissao = e?.code === 'permission-denied';
      setToast({
        mensagem: semPermissao
          ? 'Sem permissão para gravar. É preciso liberar este documento nas regras do Firebase.'
          : 'Não foi possível salvar. Tente de novo.',
        erro: true,
      });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const salvar = async () => {
    if (analise.suspeitos.length || analise.excesso || !analise.total) return;
    const nomes = {};
    TURMAS.forEach((t) => { if (analise.porTurma[t.id].length) nomes[t.id] = analise.porTurma[t.id]; });
    const ok = await gravar({ ativo: true, nomes }, `Salvo! ${analise.total} nomes no ar.`);
    if (ok) {
      setNoAr(analise.total);
      const novos = {};
      TURMAS.forEach((t) => { novos[t.id] = analise.porTurma[t.id].join('\n'); });
      setTextos(novos);
    }
  };

  const removerTodos = async () => {
    const ok = await gravar({ ativo: false, nomes: {} }, 'Nomes removidos. O efeito saiu do ar.');
    setConfirmarRemocao(false);
    if (ok) {
      setNoAr(0);
      setTextos({ '2h': '', '2l': '', '1g': '', '1j': '', '2c': '' });
    }
  };

  if (!autenticado) return null;

  const bloqueado = salvando || !analise.total || analise.suspeitos.length > 0 || analise.excesso;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {toast && <Toast mensagem={toast.mensagem} erro={toast.erro} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/painel')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 dark:bg-slate-800 rounded-lg text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Painel
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          Ver na página inicial <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-slate-100">Nomes na página inicial</h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
          Só o primeiro nome de cada aluno, um por linha. Ao salvar, os nomes passam a deslizar na página inicial, na área entre o Painel de Turmas fechado e o rodapé.
        </p>
        <p className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${noAr ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400'}`}>
          {carregando ? 'Carregando...' : noAr ? `No ar agora: ${noAr} nomes` : 'Fora do ar (nenhum nome publicado)'}
        </p>
      </div>

      <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-stone-600 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors">
        <Upload className="w-4 h-4" />
        Carregar do arquivo primeiros-nomes.json
        <input type="file" accept=".json,application/json" onChange={importarArquivo} className="hidden" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {TURMAS.map((t) => (
          <div key={t.id}>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={`nomes-${t.id}`} className="text-xs sm:text-sm font-bold text-stone-700 dark:text-slate-200">{t.rotulo}</label>
              <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">{analise.porTurma[t.id].length} nomes</span>
            </div>
            <textarea
              id={`nomes-${t.id}`}
              rows={7}
              value={textos[t.id]}
              onChange={(e) => setTextos((antes) => ({ ...antes, [t.id]: e.target.value }))}
              placeholder={'Ana\nBruno\nCarla'}
              className={`${inputBaseClass} resize-y font-medium`}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      {analise.suspeitos.length > 0 && (
        <div className="flex gap-2 p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Estas linhas parecem nomes completos. Deixe só o primeiro nome para poder salvar: <strong>{analise.suspeitos.slice(0, 5).join(', ')}{analise.suspeitos.length > 5 ? '...' : ''}</strong>
          </span>
        </div>
      )}
      {analise.excesso && (
        <div className="flex gap-2 p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Cada turma aceita até {MAX_POR_TURMA} nomes.</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        {confirmarRemocao ? (
          <div className="flex items-center gap-2">
            <button onClick={removerTodos} disabled={salvando} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">Confirmar remoção</button>
            <button onClick={() => setConfirmarRemocao(false)} className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setConfirmarRemocao(true)} disabled={salvando || !noAr} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
            <Trash2 className="w-4 h-4" /> Remover todos (tira do ar)
          </button>
        )}
        <button
          onClick={salvar}
          disabled={bloqueado}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs sm:text-sm font-bold hover:bg-amber-700 shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:shadow-none transition-colors"
        >
          <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : `Salvar e publicar (${analise.total})`}
        </button>
      </div>
    </div>
  );
}
