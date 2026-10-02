import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import { terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { db } from '../firebase';

// Linha discreta no rodape: mostra quanto espaco o Chronos guarda neste aparelho
// (para funcionar sem internet) e deixa o aluno limpar quando quiser.
// Limpar apaga so o que foi guardado para uso sem internet; o app baixa de novo na proxima vez com sinal.
// Nao mexe no tema escolhido nem no ponto em que o aluno parou nos videos.

const AVISO_MB = 100; // acima disso a linha destaca e sugere limpar

function formatar(bytes) {
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return '< 0,1 MB';
  return mb.toFixed(mb < 10 ? 1 : 0).replace('.', ',') + ' MB';
}

export default function ArmazenamentoLocal() {
  const [usado, setUsado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const medir = async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        setUsado(e.usage || 0);
      }
    } catch (_) { /* sem medidor: a linha simplesmente nao aparece */ }
  };

  useEffect(() => {
    medir();
    const ligar = () => setOnline(true);
    const desligar = () => setOnline(false);
    window.addEventListener('online', ligar);
    window.addEventListener('offline', desligar);
    return () => {
      window.removeEventListener('online', ligar);
      window.removeEventListener('offline', desligar);
    };
  }, []);

  const limpar = async () => {
    setLimpando(true);
    try { await terminate(db); await clearIndexedDbPersistence(db); } catch (_) { /* segue limpando o resto */ }
    try { for (const k of await caches.keys()) await caches.delete(k); } catch (_) { /* idem */ }
    try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (_) { /* idem */ }
    window.location.reload();
  };

  if (usado === null) return null;
  const alto = usado > AVISO_MB * 1024 * 1024;

  return (
    <div className="mt-4 flex flex-col items-center gap-1.5 px-4 text-[11px] font-semibold text-stone-400 dark:text-slate-500">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
        <span className={alto ? 'text-amber-600 dark:text-amber-500' : ''}>
          {alto ? 'Ocupando bastante espaço neste aparelho: ' : 'Guardado neste aparelho (para usar sem internet): '}
          {formatar(usado)}
        </span>
        {!confirmando && (
          <button
            onClick={() => setConfirmando(true)}
            className={`underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-500 transition-colors ${alto ? 'text-amber-600 dark:text-amber-500 font-bold' : ''}`}
          >
            Limpar
          </button>
        )}
      </div>
      {confirmando && (
        <div className="flex flex-col items-center gap-2 mt-1 max-w-xs text-center">
          <p className="leading-snug">
            {online
              ? 'Isso apaga o que foi guardado e o app baixa tudo de novo na próxima vez que abrir com internet. Sem internet, as aulas não abrem até baixar de novo.'
              : 'Para limpar, conecte-se à internet: depois o app precisa baixar tudo de novo.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={limpar}
              disabled={!online || limpando}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 font-bold shadow-sm disabled:opacity-40 hover:border-amber-400 transition-colors"
            >
              {limpando ? 'Limpando...' : 'Sim, limpar'}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={limpando}
              className="px-3 py-1.5 rounded-lg text-stone-500 dark:text-slate-400 font-bold hover:text-stone-700 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
