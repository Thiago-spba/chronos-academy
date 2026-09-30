import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AulaAnimadaJanela from '../components/AulaAnimadaJanela';
import { docIdAnimada, desempacotarAula } from '../utils/aulaGerada';

// Aula animada gerada pela IA e aprovada pelo professor (/aula-animada/<idDaAula>).
export default function AulaAnimada() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [estado, setEstado] = useState({ carregando: true, dados: null, erro: false });

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'chronos', docIdAnimada(id)));
        const dados = snap.exists() ? desempacotarAula(snap.data()) : null;
        if (vivo) setEstado({ carregando: false, dados, erro: false });
      } catch (e) {
        console.error(e);
        if (vivo) setEstado({ carregando: false, dados: null, erro: true });
      }
    })();
    return () => { vivo = false; };
  }, [id]);

  const voltar = () => (window.history.length > 1 ? navegar(-1) : navegar('/'));

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {estado.carregando && <p className="text-center text-stone-300 font-bold pt-24">Carregando a aula...</p>}
      {!estado.carregando && !estado.dados && (
        <div className="text-center text-stone-200 pt-24 px-6">
          <p className="font-bold text-lg mb-2">{estado.erro ? 'Não foi possível abrir esta aula.' : 'Aula não encontrada.'}</p>
          <p className="text-sm text-stone-400 mb-6">{estado.erro ? 'Verifique a internet e tente de novo.' : 'Ela pode ter sido retirada pelo professor.'}</p>
          <button onClick={voltar} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold">Voltar</button>
        </div>
      )}
      {estado.dados && <AulaAnimadaJanela aula={estado.dados.aula} tema={estado.dados.tema} onFechar={voltar} titulo={estado.dados.aula?.titulo} />}
    </div>
  );
}
