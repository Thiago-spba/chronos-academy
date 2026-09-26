import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { AvisoFixo } from "./Notificacao";

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
    <AvisoFixo icone={WifiOff}>
      {admin
        ? "Sem internet. Espere a conexão voltar para salvar alterações."
        : "Sem internet. Você está vendo as aulas já abertas neste aparelho."}
    </AvisoFixo>
  );
}
