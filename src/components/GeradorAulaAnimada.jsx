import { useMemo, useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Trash2, ShieldCheck, Palette } from 'lucide-react';
import AulaAnimadaJanela from './AulaAnimadaJanela';
import { compilarAula } from '../utils/compiladorAula';
import { verificarAula } from '../utils/verificadorAula';

const NOMES_BLOCO = {
  ideia: 'Explicação', termo: 'Palavra-chave', faixa: 'Problema', conta: 'Vírgula andando', coluna: 'Conta armada',
  expressoes: 'Exercícios', formula: 'Fórmula', figura: 'Figura', equacao: 'Equação', desafio: 'Desafio', revelar: 'Resposta da abertura', fecho: 'Fechamento',
};
const NOMES_MOMENTO = ['Curiosidade', 'Ver', 'Montar', 'Sua vez', 'Fechamento'];

async function chamarApi(payload) {
  const resp = await fetch('/api/gerar-aula-animada', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok || !data.aula) {
    throw new Error(data.erro || (resp.status === 413 ? 'O material é grande demais para enviar de uma vez. Marque menos PDFs.' : resp.status === 504 ? 'A IA demorou demais. Tente com menos páginas ou menos PDFs.' : 'Erro ao gerar a aula animada.'));
  }
  return data;
}

// Bloco "Aula animada com IA" do painel: gera, mostra a prévia, deixa o professor conferir e aprovar.
// valor = { aula, plano, tema, aprovada, respostas } (ou null). Nada é publicado sem "Aprovar" + salvar a aula.
export default function GeradorAulaAnimada({ valor, onChange, coletarMaterial, getToken, contexto, temaInicial = 1, nivelPadrao = 'Ensino Médio', desabilitado, avisar }) {
  const [gerando, setGerando] = useState('');
  const [nivel, setNivel] = useState(nivelPadrao);
  const [respostasNovas, setRespostasNovas] = useState({});

  const analise = useMemo(() => {
    if (!valor?.plano) return null;
    try {
      const c = compilarAula(valor.plano, { assinatura: valor.aula?.assinatura || '' });
      const v = verificarAula(valor.aula || c.aula);
      return { relatorio: c.relatorio, verificacao: v, erros: [...c.relatorio.erros, ...v.erros], avisos: [...c.relatorio.avisos, ...v.avisos], duvidas: c.relatorio.duvidas };
    } catch (e) {
      return { relatorio: { blocos: [] }, verificacao: { verificadas: 0 }, erros: ['Não consegui conferir esta aula: ' + e.message], avisos: [], duvidas: [] };
    }
  }, [valor]);

  const gerar = async (respostas) => {
    if (gerando) return;
    setGerando('Lendo o material e montando a aula… (pode levar cerca de 1 minuto)');
    try {
      const material = await coletarMaterial();
      const idToken = await getToken();
      const base = { idToken, ...material, ...contexto, nivel, respostas };
      let data = await chamarApi(base);
      let tentou = false;
      if (data.erros?.length) {
        tentou = true;
        setGerando('A conferência achou problemas. Pedindo à IA para corrigir…');
        try {
          const data2 = await chamarApi({ ...base, errosAnteriores: data.erros, planoAnterior: data.plano });
          if ((data2.erros?.length || 0) <= data.erros.length) data = data2;
        } catch (e) {
          console.warn('Segunda tentativa falhou', e);
        }
      }
      onChange({ aula: data.aula, plano: data.plano, tema: valor?.tema || temaInicial, aprovada: false, respostas, geradoEm: data.geradoEm });
      setRespostasNovas({});
      avisar(data.erros?.length ? 'A aula foi gerada, mas a conferência ainda achou problemas. Veja a lista.' : (tentou ? 'Aula gerada (corrigida automaticamente). Confira antes de aprovar.' : 'Aula gerada. Confira antes de aprovar.'), !!data.erros?.length);
    } catch (e) {
      console.error(e);
      avisar(e.message || 'Erro ao gerar a aula animada.', true);
    } finally {
      setGerando('');
    }
  };

  const responderEGerar = () => {
    const antigas = valor?.respostas || [];
    const novas = (analise?.duvidas || []).map((p, i) => ({ pergunta: p, resposta: (respostasNovas[i] || '').trim() })).filter((r) => r.resposta);
    if (!novas.length) { avisar('Escreva a resposta de pelo menos uma dúvida.', true); return; }
    gerar([...antigas, ...novas]);
  };

  const temaAtual = valor?.tema || temaInicial;
  const temErros = !!analise?.erros?.length;

  return (
    <div className="rounded-2xl border border-fuchsia-200 dark:border-fuchsia-900/50 bg-fuchsia-50/60 dark:bg-fuchsia-950/10 p-4 space-y-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-black text-fuchsia-900 dark:text-fuchsia-300"><Sparkles className="w-4 h-4" /> Aula animada com IA</p>
        <p className="text-xs text-stone-600 dark:text-slate-400 mt-1">
          A IA lê o material anexado e monta a aula. As contas são refeitas pelo sistema (a IA não calcula) e conferidas por um segundo verificador.
          Nada vai para os alunos sem a sua aprovação.
        </p>
      </div>

      {!valor && (
        <div className="flex flex-wrap items-center gap-3">
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} disabled={!!gerando || desabilitado} className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm text-stone-800 dark:text-slate-100">
            <option>Fundamental II</option>
            <option>Ensino Médio</option>
          </select>
          <button type="button" onClick={() => gerar([])} disabled={!!gerando || desabilitado} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm font-bold">
            {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gerar aula animada
          </button>
        </div>
      )}
      {gerando && <p className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {gerando}</p>}

      {valor && analise && (
        <>
          {temErros && (
            <div className="rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-3">
              <p className="text-xs font-black text-red-800 dark:text-red-300 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> A conferência achou problemas — não dá para aprovar assim</p>
              <ul className="text-xs text-red-800 dark:text-red-300 list-disc pl-5 space-y-1">{analise.erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          {analise.duvidas.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-3">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> A IA ficou em dúvida e pergunta:</p>
              {analise.duvidas.map((p, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-stone-800 dark:text-slate-200 font-bold">{p}</p>
                  <input value={respostasNovas[i] || ''} onChange={(e) => setRespostasNovas({ ...respostasNovas, [i]: e.target.value })} disabled={!!gerando} placeholder="Sua resposta (opcional)" className="w-full p-2 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs text-stone-800 dark:text-slate-100" />
                </div>
              ))}
              <button type="button" onClick={responderEGerar} disabled={!!gerando} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold"><RefreshCw className="w-3.5 h-3.5" /> Responder e gerar de novo</button>
            </div>
          )}

          {analise.avisos.length > 0 && (
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
              <p className="text-xs font-black text-stone-700 dark:text-slate-300 mb-1">Avisos</p>
              <ul className="text-xs text-stone-600 dark:text-slate-400 list-disc pl-5 space-y-1">{analise.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}

          <div className="rounded-xl overflow-hidden border border-stone-300 dark:border-slate-700 bg-black" style={{ aspectRatio: '16 / 9' }}>
            <AulaAnimadaJanela aula={valor.aula} tema={temaAtual} titulo="Prévia da aula animada" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button type="button" onClick={() => onChange({ ...valor, tema: (temaAtual % 30) + 1 })} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-900"><Palette className="w-3.5 h-3.5" /> Outro visual (tema {temaAtual})</button>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold"><ShieldCheck className="w-4 h-4" /> {analise.verificacao.verificadas} conferências matemáticas feitas</span>
          </div>

          <details className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
            <summary className="text-xs font-black text-stone-700 dark:text-slate-300 cursor-pointer">Conferir o que a aula ensina ({analise.relatorio.blocos.length} blocos)</summary>
            <ol className="mt-3 space-y-3">
              {analise.relatorio.blocos.map((b) => (
                <li key={b.n} className="text-xs text-stone-700 dark:text-slate-300">
                  <p className="font-bold">{b.n}. {NOMES_BLOCO[b.tipo] || b.tipo} <span className="font-normal text-stone-400">· {NOMES_MOMENTO[b.momento] || ''}</span></p>
                  {b.resumo && <p className="text-stone-600 dark:text-slate-400">{b.resumo}</p>}
                  {b.contas?.length > 0 && <p className="text-emerald-700 dark:text-emerald-400">Contas: {b.contas.join(' · ')}</p>}
                  {b.complemento
                    ? <p className="text-amber-700 dark:text-amber-400 font-bold">Complemento: não está no material — confira{b.fonte ? ` (${b.fonte})` : ''}</p>
                    : b.fonte ? <p className="text-stone-400">Fonte: {b.fonte}</p> : null}
                </li>
              ))}
            </ol>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            {valor.aprovada ? (
              <>
                <span className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /> Aprovada — vai para os alunos quando você salvar a aula</span>
                <button type="button" onClick={() => onChange({ ...valor, aprovada: false })} className="px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300">Desfazer aprovação</button>
              </>
            ) : (
              <button type="button" disabled={temErros || !!gerando} onClick={() => onChange({ ...valor, aprovada: true })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold"><CheckCircle2 className="w-4 h-4" /> Aprovar para os alunos</button>
            )}
            <button type="button" disabled={!!gerando} onClick={() => gerar(valor.respostas || [])} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Gerar de novo</button>
            <button type="button" disabled={!!gerando} onClick={() => onChange(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 className="w-3.5 h-3.5" /> Descartar</button>
          </div>
        </>
      )}
    </div>
  );
}
