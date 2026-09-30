import { useEffect, useRef } from 'react';

// Mostra uma aula animada (JSON do motor) dentro de um quadro (iframe).
// O quadro avisa "estou pronto" e a gente manda a aula por mensagem (so entre paginas do mesmo site).
export default function AulaAnimadaJanela({ aula, tema = 1, onFechar, className = '', titulo = 'Aula animada' }) {
  const ref = useRef(null);
  const dados = useRef({ aula, tema });
  dados.current = { aula, tema };
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  useEffect(() => {
    const ouvir = (ev) => {
      if (ev.origin !== window.location.origin) return;
      if (!ref.current || ev.source !== ref.current.contentWindow) return;
      const d = ev.data;
      if (!d) return;
      if (d.tipo === 'chronos-pronto') {
        ref.current.contentWindow.postMessage({ tipo: 'chronos-aula', aula: dados.current.aula, tema: dados.current.tema }, window.location.origin);
      } else if (d.tipo === 'chronos-fechar' && fecharRef.current) {
        fecharRef.current();
      }
    };
    window.addEventListener('message', ouvir);
    return () => window.removeEventListener('message', ouvir);
  }, []);

  // key: trocar de aula/tema recarrega o quadro do zero
  return (
    <iframe
      key={`${tema}:${aula?.titulo || ''}:${aula?.passos?.length || 0}`}
      ref={ref}
      title={titulo}
      src={`/aulas-animadas/aula.html#modo=mensagem&tema=${tema}`}
      className={className}
      style={{ border: 0, width: '100%', height: '100%', background: '#111' }}
      allow="fullscreen"
    />
  );
}
