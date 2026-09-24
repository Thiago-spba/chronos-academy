import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Nomes e frases curtas que andam soltos pela tela, como formigas, na area vazia
// entre o Painel de Turmas (fechado) e o rodape.
// - Nomes e frases sao independentes: nenhum nome e ligado a uma frase.
// - So aparece se o documento chronos/nomes_alunos existir com { ativo: true }.
// - Para ver o efeito sem nomes reais: abra o site com ?nomes=demo
// - Movimento so com CSS (transform), poucos itens por vez, desligado se o usuario pede menos animacao.

const FRASES_PADRAO = [
  'Você é 10!',
  'Você é inteligente!',
  'Você vai chegar lá!',
  'Acredite em você!',
  'Obrigado por estudar!',
  'Continue firme!',
  'Orgulho de você!',
  'Cada passo conta.',
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
@keyframes nf-wobble {
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  50% { transform: translateY(-2px) rotate(1.5deg); }
}
.nf-walker {
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  animation: nf-walk var(--dur) linear var(--delay) both;
  will-change: transform;
}
.nf-item { display: inline-block; animation: nf-wobble 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .nf-layer { display: none; }
}
`;

let cacheNomes = null; // evita ler o Firebase de novo quando o painel fecha e abre

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

function criarAndarilho(id, nomes, frases, w, h, inicial) {
  const ehNome = Math.random() < 0.65;
  const texto = ehNome ? sortear(nomes) : sortear(frases);
  const largura = ehNome ? 110 : 170; // folga para o texto entrar e sair da area

  let x0;
  let y0;
  let x1;
  let y1;
  if (Math.random() < 0.8) {
    // atravessa na horizontal, com uma leve inclinacao
    const daEsquerda = Math.random() < 0.5;
    x0 = daEsquerda ? -largura : w + 10;
    x1 = daEsquerda ? w + 10 : -largura;
    y0 = 6 + Math.random() * Math.max(10, h - 34);
    y1 = limitar(y0 + (Math.random() - 0.5) * h * 0.6, 6, Math.max(6, h - 28));
  } else {
    // atravessa na vertical
    const decendo = Math.random() < 0.5;
    y0 = decendo ? -30 : h + 6;
    y1 = decendo ? h + 6 : -30;
    x0 = 10 + Math.random() * Math.max(10, w - largura - 20);
    x1 = limitar(x0 + (Math.random() - 0.5) * w * 0.3, 10, Math.max(10, w - largura - 10));
  }

  const distancia = Math.hypot(x1 - x0, y1 - y0);
  const velocidade = 22 + Math.random() * 16; // pixels por segundo
  const dur = Math.max(14, distancia / velocidade);
  // No primeiro lote, cada um comeca em um ponto diferente do caminho (delay negativo).
  const atraso = inicial ? -(Math.random() * dur * 0.85) : Math.random() * 3;

  return { id, ehNome, texto, x0, y0, x1, y1, dur, atraso };
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

  // 2) Cria o primeiro lote quando ha nomes e a area ja tem tamanho
  useEffect(() => {
    if (!nomes.length || !camadaRef.current) return;
    const w = camadaRef.current.offsetWidth;
    const h = camadaRef.current.offsetHeight;
    if (!w || !h) return;
    caixaRef.current = { w, h };
    const quantidade = w < 640 ? 8 : 14;
    setAndarilhos(
      Array.from({ length: quantidade }, () =>
        criarAndarilho(++contador.current, nomes, frasesRef.current, w, h, true)
      )
    );
  }, [nomes]);

  // 3) Quando um item termina o caminho, entra outro sorteado no lugar
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
      className="nf-layer absolute inset-0 overflow-hidden pointer-events-none select-none"
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
          <span
            className={
              a.ehNome
                ? 'nf-item text-[13px] font-semibold text-stone-400 dark:text-slate-500'
                : 'nf-item text-xs italic font-medium text-amber-600/80 dark:text-amber-400/80'
            }
          >
            {a.texto}
          </span>
        </div>
      ))}
    </div>
  );
}
