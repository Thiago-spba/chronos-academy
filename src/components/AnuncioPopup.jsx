import { useState, useEffect } from 'react';
import { Bell, X, Megaphone, Trophy } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AnuncioPopup({ turmaId }) {
  const [mostrar, setMostrar] = useState(false);
  const [aviso, setAviso] = useState(null);

  // 1. ESCUTA O BANCO DE DADOS
  useEffect(() => {
    const docRef = doc(db, 'chronos', 'config');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().avisos) {
        const avisosDb = docSnap.data().avisos;
        
        // LÓGICA INTELIGENTE: Procura um aviso feito só para esta turma. 
        // Se não achar, procura se tem um aviso Global para todas.
        let avisoAtivo = null;
        if (avisosDb[turmaId]?.ativo) {
          avisoAtivo = avisosDb[turmaId];
        } else if (avisosDb['global']?.ativo) {
          avisoAtivo = avisosDb['global'];
        }
        
        setAviso(avisoAtivo);
      } else {
        setAviso(null);
        setMostrar(false); // Esconde se apagarem o aviso no painel
      }
    });
    return () => unsubscribe();
  }, [turmaId]);

  // 2. RELÓGIO DE FECHAMENTO (Só conta DEPOIS que o aluno clicar para abrir)
  useEffect(() => {
    if (mostrar && aviso?.duracao > 0) {
      const timer = setTimeout(() => {
        setMostrar(false); // Fecha o balão após os segundos configurados
      }, aviso.duracao * 1000);
      return () => clearTimeout(timer);
    }
  }, [mostrar, aviso]);

  // Se não houver aviso programado e ATIVO para esta turma, o componente some (nem o sino aparece).
  if (!aviso) return null;
  
  const isParabens = aviso.tipo === 'parabens';

  return (
    <div className="relative inline-flex items-center justify-end">
      
      {/* O SININHO (Só aparece se você ativou no painel) */}
      <button 
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          setMostrar(!mostrar); // Abre ou fecha o balão ao clicar
        }}
        className={`flex items-center justify-center p-3.5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg border ${isParabens ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'} hover:-translate-y-1`}
        title="Ver Comunicado"
      >
        {isParabens ? <Trophy className="w-6 h-6 animate-bounce" /> : <Bell className="w-6 h-6 animate-pulse" />}
      </button>

      {/* O BALÃO DE TEXTO (Só aparece quando 'mostrar' for verdadeiro) */}
      {mostrar && (
        <div 
          className="absolute bottom-full right-0 mb-4 w-[85vw] max-w-[340px] p-5 sm:p-6 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-[9999] animate-fade-in origin-bottom-right"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
          }}
        >
          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-stone-200 dark:border-slate-800 transform rotate-45"></div>
          
          <div className="flex justify-between items-start mb-3 relative">
            <h4 className={`font-black text-sm uppercase tracking-widest flex items-center gap-2 ${isParabens ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isParabens ? <Trophy className="w-4 h-4"/> : <Megaphone className="w-4 h-4"/>} 
              {isParabens ? 'Parabéns!' : 'Aviso Importante'}
            </h4>
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                setMostrar(false); 
              }} 
              className="p-1.5 bg-stone-100 dark:bg-slate-800 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
            {aviso.mensagem}
          </div>
        </div>
      )}
    </div>
  );
}