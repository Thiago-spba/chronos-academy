import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Megaphone, Trophy } from 'lucide-react';

const TIPOS = {
  comunicado: {
    label: 'Aviso do Professor',
    Icon: Megaphone,
    cor: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    iconCor: 'text-blue-600 dark:text-blue-400',
    labelCor: 'text-blue-600 dark:text-blue-400',
    barra: 'bg-blue-500',
  },
  parabens: {
    label: 'Parabéns, turma!',
    Icon: Trophy,
    cor: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconCor: 'text-emerald-600 dark:text-emerald-400',
    labelCor: 'text-emerald-600 dark:text-emerald-400',
    barra: 'bg-emerald-500',
  },
};

export default function AnuncioPopup() {
  const [aviso, setAviso] = useState(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, 'chronos', 'config'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.aviso?.ativo && data.aviso?.mensagem) {
            setAviso(data.aviso);
            setVisivel(true);
          }
        }
      } catch (e) { console.error('Aviso:', e); }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (!visivel || !aviso) return;
    const t = setTimeout(() => setVisivel(false), (aviso.duracao || 6) * 1000);
    return () => clearTimeout(t);
  }, [visivel, aviso]);

  if (!visivel || !aviso) return null;

  const tipo = TIPOS[aviso.tipo || 'comunicado'];
  const { Icon } = tipo;

  return (
    <>
      <style>{`@keyframes shrink-bar{from{width:100%}to{width:0%}}`}</style>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className={`pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 border ${tipo.cor} rounded-2xl shadow-2xl p-5 animate-fade-in`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${tipo.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${tipo.iconCor}`} />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${tipo.labelCor}`}>{tipo.label}</p>
              <p className="text-sm text-stone-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{aviso.mensagem}</p>
            </div>
            <button onClick={() => setVisivel(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 h-1 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${tipo.barra} rounded-full`} style={{ animation: `shrink-bar ${aviso.duracao || 6}s linear forwards` }} />
          </div>
        </div>
      </div>
    </>
  );
}
