import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Nomes e frases curtas que deslizam em "esteiras" horizontais, na area vazia
// entre o Painel de Turmas (fechado) e o rodape.
// - Cada esteira ocupa uma linha propria: itens de linhas diferentes nunca se sobrepoem.
// - Dentro da mesma esteira todos andam na mesma velocidade e com espaco fixo: nunca se chocam.
// - Nomes e frases sao independentes: nenhum nome e ligado a uma frase.
// - So aparece se o documento chronos/nomes_alunos existir com { ativo: true }.
// - Para ver o efeito sem nomes reais: abra o site com ?nomes=demo
// - Somente CSS (transform), poucos elementos animados, pausa fora da tela,
//   e desligado se o usuario pede menos animacao.

const FRASES_PADRAO = [
  'Errar faz parte de aprender.',
  'Um dia de cada vez.',
  'Pergunte sem medo.',
  'Sem pressa, com const\u00e2ncia.',
  'Que bom ter voc\u00ea aqui.',
  'Cada d\u00favida \u00e9 um come\u00e7o.',
  'Sua curiosidade importa.',
  'Voc\u00ea j\u00e1 aprendeu muito.',
  'Bom estudo!',
  'O que voc\u00ea estuda hoje abre portas amanh\u00e3.',
  'Uma p\u00e1gina por vez.',
  'Persistir tamb\u00e9m \u00e9 aprender.',
  'Sua dedica\u00e7\u00e3o faz diferen\u00e7a.',
  'Todo esfor\u00e7o conta.',
  'Aprender leva tempo, e tudo bem.',
  'Boas aulas, bons estudos!',
  'Orgulho da sua caminhada.',
  'Aqui voc\u00ea pode recome\u00e7ar.',
  'Voc\u00ea est\u00e1 no caminho certo.',
  'A Hist\u00f3ria se faz de pequenos passos.',
];

const NOMES_DEMO = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabi', 'Heitor',
  'Isabela', 'Joana', 'Lucas', 'Marina', 'Nina', 'Ot\u00e1vio', 'Paulo', 'Rafaela',
];

const ALTURA_FAIXA = 48; // altura de cada esteira, em pixels

const CSS = `
.nf-layer {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
}
.nf-lane {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  animation: nf-bob var(--bob) ease-in-out infinite;
  animation-delay: var(--bobdelay);
}
.nf-strip {
  display: flex;
  flex: none;
  width: max-content;
  white-space: nowrap;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.nf-half {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--gap);
  padding-right: var(--gap);
}
@keyframes nf-esq { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-50%, 0, 0); } }
@keyframes nf-dir { from { transform: translate3d(-50%, 0, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes nf-bob {
  0%, 100% { transform: translateY(-3px); }
  50% { transform: translateY(3px); }
}
@media (prefers-reduced-motion: reduce) {
  .nf-layer { display: none; }
}
`;

let cacheNomes = null; // evita ler o Firebase de novo quando o painel fecha e abre

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia sem repetir ate que todos tenham sido usados
function criarFila(lista) {
  let fila = [];
  return () => {
    if (!fila.length) fila = embaralhar(lista);
    return fila.pop();
  };
}

function larguraEstimada(texto, ehNome) {
  return texto.length * (ehNome ? 7.8 : 7.2) + 6;
}

function montarEsteiras(qtd, nomes, frases, larguraCaixa) {
  const proximoNome = criarFila(nomes);
  const proximaFrase = criarFila(frases);
  const alvo = Math.max(larguraCaixa, 360) * 1.5; // cada metade da esteira precisa cobrir a caixa

  return Array.from({ length: qtd }, (_, i) => {
    const gap = 120 + Math.floor(Math.random() * 5) * 24;
    const velocidade = 18 + Math.random() * 12; // pixels por segundo
    const itens = [];
    let total = 0;
    let nomesSeguidos = 0;
    let limite = 2 + Math.floor(Math.random() * 2);

    while (total < alvo || itens.length < 3) {
      const ehNome = nomesSeguidos < limite;
      const texto = ehNome ? proximoNome() : proximaFrase();
      itens.push({ texto, ehNome });
      total += larguraEstimada(texto, ehNome) + gap;
      if (ehNome) {
        nomesSeguidos += 1;
      } else {
        nomesSeguidos = 0;
        limite = 2 + Math.floor(Math.random() * 2);
      }
      if (itens.length > 60) break;
    }

    const dur = total / velocidade;
    return {
      itens,
      gap,
      dur,
      fase: Math.random() * dur, // cada esteira comeca em um ponto diferente
      sentido: i % 2 === 0 ? 'nf-esq' : 'nf-dir',
    };
  });
}

export default function NomesFlutuantes({ frases = FRASES_PADRAO }) {
  const camadaRef = useRef(null);
  const [nomes, setNomes] = useState([]);
  const [caixa, setCaixa] = useState({ w: 0, h: 0 });
  const [visivel, setVisivel] = useState(true);
  const [reduzir] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // 1) Carrega os nomes (ou os de exemplo, se o endereco tiver ?nomes=demo)
  useEffect(() => {
    if (reduzir) return undefined;
    let cancelado = false;
    const aplicar = (lista) => {
      if (!cancelado && lista.length) setNomes([...new Set(lista)]);
    };

    const demo = new URLSearchParams(window.location.search).get('nomes') === 'demo';
    if (demo) {
      aplicar(NOMES_DEMO);
      return () => { cancelado = true; };
    }

    if (cacheNomes) {
      aplicar(cacheNomes);
      return () => { cancelado = true; };
    }

    getDoc(doc(db, 'chronos', 'nomes_alunos'))
      .then((snap) => {
        if (!snap.exists()) return;
        const dados = snap.data();
        if (!dados.ativo) return; // interruptor desligado
        const lista = Object.values(dados.nomes || {})
          .flat()
          .filter((n) => typeof n === 'string' && n.trim() !== '');
        cacheNomes = lista;
        aplicar(lista);
      })
      .catch(() => {});

    return () => { cancelado = true; };
  }, [reduzir]);

  // 2) Mede a area e acompanha mudancas de tamanho da janela
  useEffect(() => {
    if (reduzir || !camadaRef.current) return undefined;
    const el = camadaRef.current;
    const medir = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setCaixa((atual) => {
        const qtdAtual = Math.floor(atual.h / ALTURA_FAIXA);
        const qtdNova = Math.floor(h / ALTURA_FAIXA);
        if (!atual.w || qtdAtual !== qtdNova || w > atual.w * 1.25) return { w, h };
        return atual;
      });
    };
    medir();
    let t;
    const aoRedimensionar = () => {
      clearTimeout(t);
      t = setTimeout(medir, 200);
    };
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', aoRedimensionar);
    };
  }, [reduzir, nomes.length]);

  // 3) Pausa as animacoes quando a area sai da tela
  useEffect(() => {
    if (reduzir || !camadaRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([entrada]) => setVisivel(entrada.isIntersecting));
    obs.observe(camadaRef.current);
    return () => obs.disconnect();
  }, [reduzir]);

  const qtdFaixas = Math.max(0, Math.min(8, Math.floor(caixa.h / ALTURA_FAIXA)));
  const esteiras = useMemo(
    () => (nomes.length && qtdFaixas ? montarEsteiras(qtdFaixas, nomes, frases, caixa.w) : []),
    // caixa.w entra so pelo valor inicial; ver medir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nomes, frases, qtdFaixas, caixa.w]
  );

  if (reduzir) return null;

  const folga = qtdFaixas ? (caixa.h - qtdFaixas * ALTURA_FAIXA) / 2 : 0;

  return (
    <div
      ref={camadaRef}
      aria-hidden="true"
      className="nf-layer absolute inset-0 overflow-hidden pointer-events-none select-none"
    >
      <style>{CSS}</style>
      {esteiras.map((e, i) => (
        <div
          key={i}
          className="nf-lane"
          style={{
            top: folga + i * ALTURA_FAIXA,
            height: ALTURA_FAIXA,
            '--bob': `${5 + (i % 3)}s`,
            '--bobdelay': `-${(i * 1.7).toFixed(1)}s`,
          }}
        >
          <div
            className="nf-strip"
            style={{
              '--gap': `${e.gap}px`,
              animationName: e.sentido,
              animationDuration: `${e.dur.toFixed(1)}s`,
              animationDelay: `-${e.fase.toFixed(1)}s`,
              animationPlayState: visivel ? 'running' : 'paused',
            }}
          >
            {[0, 1].map((copia) => (
              <div key={copia} className="nf-half">
                {e.itens.map((it, k) => (
                  <span
                    key={k}
                    className={
                      it.ehNome
                        ? 'text-[13px] font-semibold text-stone-400 dark:text-slate-500'
                        : 'text-xs italic font-medium text-amber-600/80 dark:text-amber-400/80'
                    }
                  >
                    {it.texto}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
