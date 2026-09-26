import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// Faixa que aparece quando o aparelho fica sem internet.
export default function AvisoConexao({ admin = false }) {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const ligar = () => setOnline(true);
    const desligar = () => setOnline(false);
    window.addEventListener("online", ligar);
    window.addEventListener("offline", desligar);
    return () => {
      window.removeEventListener("online", ligar);
      window.removeEventListener("offline", desligar);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md rounded-2xl shadow-lg bg-stone-800 dark:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-2 text-center">
      <WifiOff className="w-4 h-4 shrink-0" />
      {admin
        ? "Sem internet. Espere a conexão voltar para salvar alterações."
        : "Sem internet. Você está vendo as aulas já abertas neste aparelho."}
    </div>
  );
}
