// Ilustracao de cada tema do "Material de estudo".
// Por enquanto usa icones; quando o album de ilustracoes ficar pronto,
// basta preencher "imagem" com o endereco de cada ilustracao aprovada.
import {
  Landmark, Sigma, CodeXml, Cpu, Network, ShieldCheck,
  Briefcase, MessagesSquare, FlaskConical, BookOpen,
} from "lucide-react";

export const TEMAS_MATERIAL = {
  historia:     { rotulo: "História",           Icone: Landmark,       cor: "from-amber-500 to-orange-600",  imagem: null },
  matematica:   { rotulo: "Matemática",         Icone: Sigma,          cor: "from-sky-500 to-indigo-600",    imagem: null },
  programacao:  { rotulo: "Programação",        Icone: CodeXml,        cor: "from-emerald-500 to-teal-600",  imagem: null },
  tecnologia:   { rotulo: "Tecnologia",         Icone: Cpu,            cor: "from-violet-500 to-purple-600", imagem: null },
  redes:        { rotulo: "Redes e Internet",   Icone: Network,        cor: "from-cyan-500 to-blue-600",     imagem: null },
  seguranca:    { rotulo: "Segurança digital",  Icone: ShieldCheck,    cor: "from-rose-500 to-red-600",      imagem: null },
  carreira:     { rotulo: "Carreira",           Icone: Briefcase,      cor: "from-yellow-500 to-amber-600",  imagem: null },
  comunicacao:  { rotulo: "Comunicação",        Icone: MessagesSquare, cor: "from-pink-500 to-fuchsia-600",  imagem: null },
  ciencias:     { rotulo: "Ciências",           Icone: FlaskConical,   cor: "from-lime-500 to-green-600",    imagem: null },
  geral:        { rotulo: "Geral",              Icone: BookOpen,       cor: "from-stone-500 to-slate-600",   imagem: null },
};

export function temaMaterial(chave) {
  return TEMAS_MATERIAL[chave] || TEMAS_MATERIAL.geral;
}

// Quantos trechos marcados como "complemento da IA" ainda nao foram conferidos.
export function pendenciasMaterial(material) {
  if (!material) return 0;
  const s = (material.secoes || []).filter((x) => x.complemento).length;
  const t = (material.termos || []).filter((x) => x.complemento).length;
  return s + t;
}
