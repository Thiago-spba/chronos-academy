import { useEffect, useRef, useState } from 'react';
import { Bug } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Nomes que andam pelo cartao do professor, como formigas, com frases curtas de incentivo.
// - So aparece se o documento chronos/nomes_alunos existir com { ativo: true }.
// - Para ver o efeito sem nomes reais: abra o site com ?nomes=demo
// - Movimento so com CSS (transform), poucos itens por vez, desligado se o usuario pede menos animacao.

const FRASES_PADRAO = [
  '{nome}, você é 10!',
  'Você é inteligente, {nome}!',
  '{nome}, você vai chegar lá!',
  'Acredite em você, {nome}!',
  'Obrigado por estudar comigo, {nome}!',
  '{nome}, continue firme!',
  'Orgulho de você, {nome}!',
  '{nome}, cada passo conta.',
];

const NOMES_DEMO = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabi', 'Heitor',
  'Isabela', 'Joana', 'Lucas', 'Marina', 'Nina', 'Otávio', 'Paulo', 'Rafaela',
];

const CSS = `
@keyframes nf-walk {
  from { transform: translate3d(var(--x0), var(--y0), 0); }
  to { transform: translate3d(var(--x1), var(--y1), 0); }
}
@keyframes nf-bubble {
  0%, 28% { opacity: 0; transform: translateY(4px); }
  34%, 62% { opacity: 1; transform: translateY(0); }
  68%, 100% { opacity: 0; transform: translateY(0); }
}
@keyframes nf-wobble {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-2px) rotate(2deg); }
}
.nf-walker {
  position: absolute;
  left: 0;
  top: 0;
  animation: nf-walk var(--dur) linear var(--delay) both;
  will-change: transform;
}
.nf-bubble { animation: nf-bubble var(--dur) linear var(--delay) both; }
.nf-chip { animation: nf-wobble 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .nf-layer { display: none; }
}
`;

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

function criarAndarilho(id, nomes, frases, w, h, inicial) {
  const nome = sortear(nomes);
  const dur = 24 + Math.random() * 16;
  let x0;
  let y0;
  let x1;
  let y1;

  if (Math.random() < 0.55) {
    // atravessa na horizontal
    const daEsquerda = Math.random() < 0.5;
    x0 = daEsquerda ? -150 : w + 10;
    x1 = daEsquerda ? w + 10 : -150;
    y0 = 24 + Math.random() * Math.max(10, h - 64);
    y1 = limitar(y0 + (Math.random() - 0.5) * h * 0.5, 24, Math.max(24, h - 40));
  } else {
    // atravessa na vertical
    const decendo = Math.random() < 0.5;
    y0 = decendo ? -50 : h + 10;
    y1 = decendo ? h + 10 : -50;
    x0 = 10 + Math.random() * Math.max(10, w - 210);
    x1 = limitar(x0 + (Math.random() - 0.5) * w * 0.4, 10, Math.max(10, w - 210));
  }

  const frase = Math.random() < 0.6 ? sortear(frases).replace('{nome}', nome) : null;
  // No primeiro lote, cada um comeca em um ponto diferente do caminho (delay negativo).
  const atraso = inicial ? -(Math.random() * dur * 0.85) : Math.random() * 3;

  return { id, nome, frase, x0, y0, x1, y1, dur, atraso };
}

export default function NomesFlutuantes({ frases = FRASES_PADRAO }) {
  const camadaRef = useRef(null);
  const caixaRef = useRef({ w: 0, h: 0 });
  const frasesRef = useRef(frases);
  const contador = useRef(0);
  const [nomes, setNomes] = useState([]);
  const [andarilhos, setAndarilhos] = useState([]);
  const [reduzir] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  frasesRef.current = frases;

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

    getDoc(doc(db, 'chronos', 'nomes_alunos'))
      .then((snap) => {
        if (!snap.exists()) return;
        const dados = snap.data();
        if (!dados.ativo) return; // interruptor desligado
        const lista = Object.values(dados.nomes || {})
          .flat()
          .filter((n) => typeof n === 'string' && n.trim() !== '');
        aplicar(lista);
      })
      .catch(() => {});

    return () => { cancelado = true; };
  }, [reduzir]);

  // 2) Cria o primeiro lote quando ha nomes e a caixa ja tem tamanho
  useEffect(() => {
    if (!nomes.length || !camadaRef.current) return;
    const w = camadaRef.current.offsetWidth;
    const h = camadaRef.current.offsetHeight;
    if (!w || !h) return;
    caixaRef.current = { w, h };
    const quantidade = w < 640 ? 7 : 12;
    setAndarilhos(
      Array.from({ length: quantidade }, () =>
        criarAndarilho(++contador.current, nomes, frasesRef.current, w, h, true)
      )
    );
  }, [nomes]);

  // 3) Quando um nome termina o caminho, entra outro sorteado no lugar
  const reciclar = (id) => {
    const { w, h } = caixaRef.current;
    setAndarilhos((prev) =>
      prev.map((a) => (a.id === id ? criarAndarilho(++contador.current, nomes, frasesRef.current, w, h, false) : a))
    );
  };

  if (reduzir) return null;

  return (
    <div
      ref={camadaRef}
      aria-hidden="true"
      className="nf-layer absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      <style>{CSS}</style>
      {andarilhos.map((a) => (
        <div
          key={a.id}
          className="nf-walker"
          style={{
            '--x0': `${a.x0}px`,
            '--y0': `${a.y0}px`,
            '--x1': `${a.x1}px`,
            '--y1': `${a.y1}px`,
            '--dur': `${a.dur}s`,
            '--delay': `${a.atraso}s`,
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === 'nf-walk') reciclar(a.id);
          }}
        >
          {a.frase && (
            <span className="nf-bubble absolute left-0 bottom-full mb-1.5 w-max max-w-[190px] px-2.5 py-1.5 rounded-xl text-[11px] leading-snug font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-slate-700 shadow-sm">
              {a.frase}
            </span>
          )}
          <div className="nf-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-white/60 text-stone-500 border border-stone-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/70">
            <Bug className="w-3 h-3 shrink-0 text-amber-500 dark:text-amber-400" />
            {a.nome}
          </div>
        </div>
      ))}
    </div>
  );
}
