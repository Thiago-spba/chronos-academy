// Visual do "Material de Estudo": ilustracao (icone do conceito), cor e layout.
// A IA sugere ate 3 icones ligados ao assunto; cor e layout sao escolhidos aqui
// para nao repetir o visual das ultimas 30 aulas da turma.
import {
  FileText, FileSpreadsheet, FolderOpen, CodeXml, SquareTerminal, Repeat, GitBranch, Braces,
  Variable, ListOrdered, Grid3x3, Database, MemoryStick, Cpu, Server, Network, Globe, Cloud, Wifi,
  ShieldCheck, KeyRound, Bug, Workflow, Binary, AppWindow, Smartphone, Bot, Filter, Layers,
  Calculator, Divide, Percent, Sigma, Radical, Pi, Shapes, Triangle, Ruler, ChartLine, ChartColumn,
  ChartPie, Dices, Coins, Infinity as InfinityIcon,
  History, Pyramid, Castle, Crown, Landmark, Ship, Map as MapIcon, Earth, Swords, Flag, Factory, Hammer,
  Wheat, Scroll, Scale, Vote, Users, Church, Building2, Store, Newspaper,
  Briefcase, Handshake, MessagesSquare, Presentation, Target, Lightbulb, TrendingUp, HeartHandshake,
  Brain, Rocket, FlaskConical, Leaf, GraduationCap,
} from "lucide-react";
import { CATALOGO_ICONES, chaveIcone } from "./catalogoIcones.js";
import { ordenarModulos } from "./bimestres.js";

const DESENHOS = {
  arquivo: FileText, planilha_csv: FileSpreadsheet, pasta: FolderOpen, codigo: CodeXml, terminal: SquareTerminal,
  laco: Repeat, condicao: GitBranch, funcao: Braces, variavel: Variable, lista: ListOrdered, matriz: Grid3x3,
  banco_dados: Database, memoria: MemoryStick, hardware: Cpu, servidor: Server, rede: Network, internet: Globe,
  nuvem: Cloud, sem_fio: Wifi, seguranca: ShieldCheck, senha: KeyRound, erro: Bug, algoritmo: Workflow,
  binario: Binary, aplicativo: AppWindow, celular: Smartphone, ia: Bot, filtro: Filter, organizacao: Layers,
  calculo: Calculator, fracao: Divide, porcentagem: Percent, equacao: Sigma, raiz: Radical, circulo: Pi,
  geometria: Shapes, triangulo: Triangle, medidas: Ruler, grafico: ChartLine, estatistica: ChartColumn,
  proporcao: ChartPie, probabilidade: Dices, financeira: Coins, sequencia: InfinityIcon,
  linha_tempo: History, antiguidade: Pyramid, idade_media: Castle, monarquia: Crown, estado: Landmark,
  navegacoes: Ship, territorio: MapIcon, mundo: Earth, conflito: Swords, revolucao: Flag, industria: Factory,
  trabalho: Hammer, agricultura: Wheat, documento: Scroll, direitos: Scale, democracia: Vote, sociedade: Users,
  religiao: Church, cidade: Building2, comercio: Store, imprensa: Newspaper,
  carreira: Briefcase, equipe: Handshake, comunicacao: MessagesSquare, apresentacao: Presentation, metas: Target,
  ideia: Lightbulb, crescimento: TrendingUp, socioemocional: HeartHandshake, aprendizagem: Brain, projeto: Rocket,
  ciencia: FlaskConical, natureza: Leaf, geral: GraduationCap,
};

// Classes escritas por extenso para o Tailwind encontrar.
export const CORES = [
  { id: "ambar",     grad: "from-amber-500 to-orange-600",   texto: "text-amber-700 dark:text-amber-400",     suave: "bg-amber-50 dark:bg-amber-500/10",     borda: "border-amber-200 dark:border-amber-500/30",     marca: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",     linha: "bg-amber-400",   destaque: "decoration-amber-500" },
  { id: "esmeralda", grad: "from-emerald-500 to-teal-600",   texto: "text-emerald-700 dark:text-emerald-400", suave: "bg-emerald-50 dark:bg-emerald-500/10", borda: "border-emerald-200 dark:border-emerald-500/30", marca: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", linha: "bg-emerald-400", destaque: "decoration-emerald-500" },
  { id: "celeste",   grad: "from-sky-500 to-blue-600",       texto: "text-sky-700 dark:text-sky-400",         suave: "bg-sky-50 dark:bg-sky-500/10",         borda: "border-sky-200 dark:border-sky-500/30",         marca: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",             linha: "bg-sky-400",     destaque: "decoration-sky-500" },
  { id: "violeta",   grad: "from-violet-500 to-purple-600",  texto: "text-violet-700 dark:text-violet-400",   suave: "bg-violet-50 dark:bg-violet-500/10",   borda: "border-violet-200 dark:border-violet-500/30",   marca: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400", linha: "bg-violet-400",  destaque: "decoration-violet-500" },
  { id: "rosa",      grad: "from-rose-500 to-pink-600",      texto: "text-rose-700 dark:text-rose-400",       suave: "bg-rose-50 dark:bg-rose-500/10",       borda: "border-rose-200 dark:border-rose-500/30",       marca: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",         linha: "bg-rose-400",    destaque: "decoration-rose-500" },
  { id: "indigo",    grad: "from-indigo-500 to-blue-700",    texto: "text-indigo-700 dark:text-indigo-400",   suave: "bg-indigo-50 dark:bg-indigo-500/10",   borda: "border-indigo-200 dark:border-indigo-500/30",   marca: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400", linha: "bg-indigo-400",  destaque: "decoration-indigo-500" },
  { id: "lima",      grad: "from-lime-500 to-green-600",     texto: "text-green-700 dark:text-green-400",     suave: "bg-lime-50 dark:bg-lime-500/10",       borda: "border-lime-200 dark:border-lime-500/30",       marca: "bg-lime-100 text-green-700 dark:bg-lime-500/15 dark:text-lime-400",        linha: "bg-lime-500",    destaque: "decoration-lime-500" },
  { id: "ciano",     grad: "from-cyan-500 to-sky-600",       texto: "text-cyan-700 dark:text-cyan-400",       suave: "bg-cyan-50 dark:bg-cyan-500/10",       borda: "border-cyan-200 dark:border-cyan-500/30",       marca: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",         linha: "bg-cyan-400",    destaque: "decoration-cyan-500" },
  { id: "fucsia",    grad: "from-fuchsia-500 to-purple-600", texto: "text-fuchsia-700 dark:text-fuchsia-400", suave: "bg-fuchsia-50 dark:bg-fuchsia-500/10", borda: "border-fuchsia-200 dark:border-fuchsia-500/30", marca: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400", linha: "bg-fuchsia-400", destaque: "decoration-fuchsia-500" },
  { id: "coral",     grad: "from-orange-500 to-red-600",     texto: "text-orange-700 dark:text-orange-400",   suave: "bg-orange-50 dark:bg-orange-500/10",   borda: "border-orange-200 dark:border-orange-500/30",   marca: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400", linha: "bg-orange-400",  destaque: "decoration-orange-500" },
];

// lateral: icone ao lado do titulo, secoes numeradas
// faixa:   faixa colorida no topo, secoes com barra lateral
// centro:  icone grande centralizado, secoes em cartoes
// trilha:  icone marca-d'agua, secoes em linha do tempo
export const LAYOUTS = ["lateral", "faixa", "centro", "trilha"];

// 40 combinacoes (10 cores x 4 layouts), em ordem que alterna cor e layout.
const COMBOS = Array.from({ length: CORES.length * LAYOUTS.length }, (_, k) => {
  const metade = Math.floor(k / (CORES.length * 2));
  return { cor: CORES[k % CORES.length].id, layout: LAYOUTS[(k + metade) % LAYOUTS.length] };
});

export const JANELA_SEM_REPETIR = 30;

export function opcoesIcones() {
  return Object.entries(CATALOGO_ICONES).map(([chave, info]) => ({ chave, ...info }));
}

// Visual pronto para desenhar (aceita materiais antigos, que so tinham "tema").
export function visualDoMaterial(material) {
  const v = material?.visual || {};
  const chave = chaveIcone(v.icone) || chaveIcone(material?.tema) || "geral";
  const cor = CORES.find((c) => c.id === v.cor) || CORES[0];
  const layout = LAYOUTS.includes(v.layout) ? v.layout : "lateral";
  return { icone: chave, Icone: DESENHOS[chave] || GraduationCap, rotulo: CATALOGO_ICONES[chave]?.rotulo || "Estudo", cor, layout };
}

// Visual das ultimas aulas publicadas na turma (da mais antiga para a mais recente).
export function visuaisRecentes(turma, aulaIdAtual, janela = JANELA_SEM_REPETIR) {
  const lista = [];
  ordenarModulos(turma?.modulos).forEach((m) =>
    (m.aulas || []).forEach((a) => {
      if (a.id !== aulaIdAtual && a.visualMaterial) lista.push(a.visualMaterial);
    })
  );
  return lista.slice(-janela);
}

// Escolhe icone, cor e layout sem repetir as ultimas aulas.
// Icone: a sugestao da IA mais ligada ao assunto que ainda nao foi usada; se todas foram, repete a principal
// (o assunto vem antes da novidade; a cor e o layout garantem que o visual fica diferente).
// Cor + layout: combinacao que nao aparece nas recentes e nao repete a cor nem o layout da aula anterior.
export function escolherVisual({ sugestoes = [], recentes = [] } = {}) {
  const validas = [...new Set(sugestoes.map(chaveIcone).filter(Boolean))];
  if (validas.length === 0) validas.push("geral");
  const iconesUsados = new Set(recentes.map((v) => chaveIcone(v?.icone)));
  const icone = validas.find((k) => !iconesUsados.has(k)) || validas[0];

  const chaveCombo = (v) => `${v?.cor}|${v?.layout}`;
  const ultimoUso = new Map();
  recentes.forEach((v, i) => ultimoUso.set(chaveCombo(v), i));
  const anterior = recentes[recentes.length - 1];
  const inicio = anterior ? (COMBOS.findIndex((c) => chaveCombo(c) === chaveCombo(anterior)) + 1) : 0;
  const emOrdem = COMBOS.map((_, i) => COMBOS[(Math.max(inicio, 0) + i) % COMBOS.length]);

  const livre = emOrdem.find((c) => !ultimoUso.has(chaveCombo(c)) && (!anterior || (c.cor !== anterior.cor && c.layout !== anterior.layout)))
    || emOrdem.find((c) => !ultimoUso.has(chaveCombo(c)))
    // todas usadas (mais de 40 aulas na janela): a que foi usada ha mais tempo
    || [...emOrdem].sort((a, b) => (ultimoUso.get(chaveCombo(a)) ?? -1) - (ultimoUso.get(chaveCombo(b)) ?? -1))[0];

  return { icone, cor: livre.cor, layout: livre.layout };
}

// Quantos trechos acrescentados pela IA ainda nao foram conferidos.
export function pendenciasMaterial(material) {
  if (!material) return 0;
  const s = (material.secoes || []).filter((x) => x.complemento).length;
  const t = (material.termos || []).filter((x) => x.complemento).length;
  return s + t + (material.contextoComplemento ? 1 : 0);
}
