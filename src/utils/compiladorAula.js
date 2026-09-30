// Compilador das aulas animadas.
// A IA NÃO desenha nem calcula: ela devolve um "plano" (blocos com o conteúdo da aula).
// Este arquivo transforma o plano nos dados do motor (public/aulas-animadas/lib/motor.js),
// escolhe as posições e faz TODAS as contas com aritmética exata (matematicaExata.js).
// Sem dependências de navegador: roda no painel e no servidor.

import * as M from "./matematicaExata.js";

export const MOMENTOS = ["curiosidade", "ver", "montar", "suavez", "fechamento"];
export const TIPOS_BLOCO = ["ideia", "termo", "faixa", "conta", "coluna", "expressoes", "formula", "figura", "equacao", "desafio", "revelar", "fecho"];
const MOMENTO_PADRAO = { ideia: 1, termo: 1, faixa: 1, figura: 1, conta: 2, coluna: 2, expressoes: 2, formula: 2, equacao: 2, desafio: 3, revelar: 2, fecho: 4 };
const LETRAS = "ABCD";

/* ------------------------------------------------------------------ */
/* limpeza do que vem da IA                                            */
/* ------------------------------------------------------------------ */
function limpa(v, max) {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return "";
  let s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if ((s.match(/\*/g) || []).length % 2) s = s.replace(/\*/g, ""); // destaque precisa abrir e fechar
  if (s.length <= max) return s;
  // corta na última palavra inteira (nunca no meio de uma palavra)
  const corte = s.slice(0, max);
  const esp = corte.lastIndexOf(" ");
  let r = (esp >= max * 0.5 ? corte.slice(0, esp) : corte).replace(/[\s,;:(–-]+$/, "");
  if ((r.match(/\*/g) || []).length % 2) r = r.replace(/\*/g, "");
  return r;
}
const lista = (v, n, max) => (Array.isArray(v) ? v : []).map((x) => limpa(x, max)).filter(Boolean).slice(0, n);
const slug = (t) => limpa(t, 40).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "termo";
function inteiro(v, min, max) { const n = Number.parseInt(v, 10); return Number.isFinite(n) && n >= min && n <= max ? n : null; }
function mapaTextos(v, maxChaves = 8) {
  const out = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    Object.keys(v).slice(0, maxChaves).forEach((k) => { const val = limpa(v[k], 30); if (val && limpa(k, 12)) out[limpa(k, 12)] = val; });
  }
  return out;
}

// Quebra um texto em linhas de até "max" caracteres (sem cortar palavras).
export function quebrar(texto, max) {
  const palavras = String(texto).split(" ");
  const linhas = [];
  let atual = "";
  palavras.forEach((p) => {
    const t = atual ? atual + " " + p : p;
    if (t.replace(/\*/g, "").length > max && atual) { linhas.push(atual); atual = p; }
    else atual = t;
  });
  if (atual) linhas.push(atual);
  return linhas;
}
const compr = (t) => String(t).replace(/\*/g, "").length;

/* ------------------------------------------------------------------ */
/* plano normalizado                                                   */
/* ------------------------------------------------------------------ */
export function normalizarPlano(bruto) {
  const avisos = [];
  const b = bruto && typeof bruto === "object" ? bruto : {};
  const plano = { titulo: limpa(b.titulo, 44), termos: [], abertura: null, blocos: [], duvidas: lista(b.duvidas, 8, 400), avisos: lista(b.avisos, 10, 400) };

  const vistos = new Set();
  (Array.isArray(b.termos) ? b.termos : []).slice(0, 6).forEach((t) => {
    const chave = slug(t?.chave || t?.chip);
    if (vistos.has(chave)) return;
    const chip = limpa(t?.chip, 18);
    const titulo = limpa(t?.titulo || t?.chip, 40).toUpperCase();
    const oQueE = lista(t?.oQueE, 3, 60), explicando = lista(t?.explicando, 3, 60), exemplo = lista(t?.exemplo, 3, 60);
    if (!chip || !titulo || oQueE.length === 0) return;
    vistos.add(chave);
    plano.termos.push({ chave, chip, titulo, oQueE, explicando, exemplo });
  });

  const a = b.abertura;
  if (a && typeof a === "object") {
    const alternativas = lista(a.alternativas, 4, 30);
    plano.abertura = {
      antes: limpa(a.antes, 60), destaque: limpa(a.destaque, 24), depois: limpa(a.depois, 60),
      alternativas, correta: inteiro(a.correta, 0, 3), calculo: limpa(a.calculo, 120), legenda: limpa(a.legenda, 80),
    };
  }

  (Array.isArray(b.blocos) ? b.blocos : []).slice(0, 30).forEach((x, i) => {
    const tipo = limpa(x?.tipo, 20).toLowerCase();
    if (!TIPOS_BLOCO.includes(tipo)) { avisos.push(`Bloco ${i + 1}: tipo "${tipo}" não existe e foi ignorado.`); return; }
    let momento = typeof x?.momento === "string" ? MOMENTOS.indexOf(limpa(x.momento, 20).toLowerCase().replace(/\s/g, "")) : inteiro(x?.momento, 0, 4);
    if (momento == null || momento < 0) momento = MOMENTO_PADRAO[tipo];
    const base = { tipo, momento, fonte: limpa(x?.fonte, 200), complemento: x?.complemento === true, legenda: limpa(x?.legenda, 90) };
    let blk;
    if (tipo === "ideia") blk = { ...base, titulo: limpa(x?.titulo, 60), linhas: lista(x?.linhas, 5, 120), destaque: limpa(x?.destaque, 80) };
    else if (tipo === "termo") blk = { ...base, chave: slug(x?.chave) };
    else if (tipo === "faixa") blk = { ...base, antes: limpa(x?.antes, 60), numero: limpa(x?.numero, 30), depois: limpa(x?.depois, 60) };
    else if (tipo === "conta") blk = { ...base, numero: limpa(x?.numero, 20), op: x?.op === "div" ? "div" : "mul", fator: limpa(x?.fator, 12), unidadeDe: limpa(x?.unidadeDe, 14), unidadePara: limpa(x?.unidadePara, 14), nota: lista(x?.nota, 4, 60).filter((n) => n.length <= 22).slice(0, 2), legenda2: limpa(x?.legenda2, 90) };
    else if (tipo === "coluna") blk = { ...base, op: /sub|menos|-/i.test(limpa(x?.op, 20)) ? "sub" : "add", a: limpa(x?.a, 20), b: limpa(x?.b, 20), titulo: limpa(x?.titulo, 40), unidade: limpa(x?.unidade, 24), notas: lista(x?.notas, 3, 60) };
    else if (tipo === "expressoes") {
      const itens = (Array.isArray(x?.itens) ? x.itens : []).slice(0, 6).map((it) => (typeof it === "string" ? { expr: limpa(it, 90) } : { rotulo: limpa(it?.rotulo, 12), expr: limpa(it?.expr, 90), unidade: limpa(it?.unidade, 24), nota: limpa(it?.nota, 70) })).filter((it) => it.expr);
      blk = { ...base, titulo: limpa(x?.titulo, 60), itens, passoAPasso: x?.passoAPasso === true };
    } else if (tipo === "formula") blk = { ...base, nome: limpa(x?.nome, 50), formula: limpa(x?.formula, 60), valores: mapaTextos(x?.valores), unidades: mapaTextos(x?.unidades), variaveis: mapaTextos(x?.variaveis, 6), legenda2: limpa(x?.legenda2, 90) };
    else if (tipo === "figura") blk = { ...base, forma: limpa(x?.forma, 20).toLowerCase(), medidas: mapaTextos(x?.medidas, 6), unidade: limpa(x?.unidade, 8), legendas: lista(x?.legendas, 3, 90), grade: x?.grade !== false };
    else if (tipo === "equacao") blk = { ...base, titulo: limpa(x?.titulo, 50), equacao: limpa(x?.equacao, 60) };
    else if (tipo === "desafio") blk = { ...base, enunciado: lista(x?.enunciado, 4, 140), alternativas: lista(x?.alternativas, 4, 30), calculo: limpa(x?.calculo, 120), unidade: limpa(x?.unidade, 16), correta: inteiro(x?.correta, 0, 3), legenda2: limpa(x?.legenda2, 90) };
    else if (tipo === "revelar") blk = { ...base };
    else blk = { ...base, titulo: limpa(x?.titulo, 40), regra: lista(x?.regra, 5, 80), pegaTitulo: limpa(x?.pegaTitulo, 40), pega: lista(x?.pega, 4, 80) };
    plano.blocos.push(blk);
  });
  plano.avisos = [...plano.avisos, ...avisos];
  return plano;
}

/* ------------------------------------------------------------------ */
/* utilidades do compilador                                            */
/* ------------------------------------------------------------------ */
const bonita = (t) => String(t).replace(/\*/g, "×").replace(/\//g, "÷").replace(/(?<=\s)-(?=\s)/g, "−").replace(/\s+/g, " ").trim();
function areaDe(un) { if (!un) return ""; return /²$/.test(un) ? un : un + "²"; }
function ehPotenciaDe10(s) { return /^10*$/.test(String(s).replace(/\s/g, "")) && String(s).replace(/\s/g, "").length >= 2; }
const digitosInteiros = (s) => String(s).replace(/\s/g, "").split(",")[0].replace("-", "").length;
const casas = (s) => (String(s).split(",")[1] || "").length;
function numerosDoTexto(t) {
  const ns = [];
  const re = /\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
  let m;
  while ((m = re.exec(String(t).replace(/ /g, " ")))) { try { ns.push(M.lerNumero(m[0])); } catch { /* ignora */ } }
  return ns;
}
// Descobre qual alternativa contém o valor calculado. Devolve {indice|null, motivo}
function alternativaCerta(alternativas, valor) {
  const acertos = [];
  alternativas.forEach((alt, i) => {
    const ns = numerosDoTexto(alt);
    if (ns.length === 1 && M.igual(ns[0], valor)) acertos.push(i);
    else if (ns.length === 2) {
      const [lo, hi] = M.comparar(ns[0], ns[1]) <= 0 ? [ns[0], ns[1]] : [ns[1], ns[0]];
      if (M.comparar(valor, lo) >= 0 && M.comparar(valor, hi) <= 0) acertos.push(i);
    }
  });
  return acertos.length === 1 ? { indice: acertos[0] } : { indice: null, quantas: acertos.length };
}

/* ------------------------------------------------------------------ */
/* geometria (figuras em unidades da própria figura)                   */
/* ------------------------------------------------------------------ */
function num(m, k) { const v = m[k]; if (v == null) throw new Error(`Faltou a medida "${k}".`); const f = M.lerNumero(v); if (f.n <= 0n) throw new Error(`A medida "${k}" precisa ser maior que zero.`); return f; }

function montarFigura(bl, id) {
  const forma = bl.forma, m = bl.medidas, un = bl.unidade || "";
  const areaUn = areaDe(un);
  const f = (k) => paraN(num(m, k));
  let W, H, formas = [], cotas = [], formula, valores, medidasTxt, gradeOk = false, animacao = null, nomeForma, dimBH = null;
  const U = un ? " " + un : "";
  const sufixo = (k) => `${m[k]}${U}`;
  if (forma === "retangulo" || forma === "quadrado") {
    const quad = forma === "quadrado";
    const b = quad ? f("lado") : f("base"), h = quad ? f("lado") : f("altura");
    W = b; H = h;
    formas.push({ tipo: "ret", x: 0, y: 0, w: b, h, estilo: "area" });
    cotas.push({ de: [0, h], ate: [b, h], lado: "baixo", texto: quad ? `l = ${sufixo("lado")}` : `b = ${sufixo("base")}` });
    cotas.push({ de: [b, 0], ate: [b, h], lado: "dir", texto: quad ? `l = ${sufixo("lado")}` : `h = ${sufixo("altura")}` });
    formula = quad ? "A = l × l" : "A = b × h";
    valores = quad ? { l: m.lado } : { b: m.base, h: m.altura };
    medidasTxt = quad ? [`lado l = ${sufixo("lado")}`] : [`base b = ${sufixo("base")}`, `altura h = ${sufixo("altura")}`];
    dimBH = [b, h];
    gradeOk = Number.isInteger(b) && Number.isInteger(h) && b <= 12 && h <= 9;
    nomeForma = quad ? "quadrado" : "retângulo";
    animacao = "grade";
  } else if (forma === "paralelogramo") {
    const b = f("base"), h = f("altura");
    const s = m.inclinacao ? Math.min(f("inclinacao"), b * 0.9) : Math.round(b * 35) / 100;
    W = b + s; H = h;
    formas.push({ tipo: "poli", pontos: [[s, 0], [s + b, 0], [b, h], [0, h]], estilo: "area" });
    formas.push({ tipo: "poli", pontos: [[s, 0], [0, h], [s, h]], estilo: "celula", oculta: true, id: id + "_tri" });
    formas.push({ tipo: "linha", x1: s, y1: 0, x2: s, y2: h, estilo: "tracejado" });
    formas.push({ tipo: "texto", x: s + 0.03 * b, y: h / 2, t: `h = ${sufixo("altura")}`, tam: 28, cor: "yellow", ancora: "inicio" });
    cotas.push({ de: [0, h], ate: [b, h], lado: "baixo", texto: `b = ${sufixo("base")}` });
    formula = "A = b × h"; valores = { b: m.base, h: m.altura };
    medidasTxt = [`base b = ${sufixo("base")}`, `altura h = ${sufixo("altura")}`];
    animacao = { tipo: "paralelogramo", dx: b, id: id + "_tri" };
    nomeForma = "paralelogramo";
  } else if (forma === "triangulo") {
    const b = f("base"), h = f("altura"), a = Math.round(b * 35) / 100;
    W = b + a; H = h;
    formas.push({ tipo: "poli", pontos: [[0, h], [b, h], [a, 0]], estilo: "area" });
    formas.push({ tipo: "poli", pontos: [[b, h], [b + a, 0], [a, 0]], estilo: "celula", oculta: true, id: id + "_t2" });
    formas.push({ tipo: "linha", x1: a, y1: 0, x2: a, y2: h, estilo: "tracejado" });
    formas.push({ tipo: "texto", x: a + 0.03 * b, y: h / 2, t: `h = ${sufixo("altura")}`, tam: 28, cor: "yellow", ancora: "inicio" });
    cotas.push({ de: [0, h], ate: [b, h], lado: "baixo", texto: `b = ${sufixo("base")}` });
    formula = "A = b × h / 2"; valores = { b: m.base, h: m.altura };
    medidasTxt = [`base b = ${sufixo("base")}`, `altura h = ${sufixo("altura")}`];
    animacao = { tipo: "triangulo", id: id + "_t2" };
    nomeForma = "triângulo";
  } else if (forma === "trapezio") {
    const B = f("baseMaior"), bb = f("baseMenor"), h = f("altura");
    if (bb >= B) throw new Error("No trapézio, a base maior precisa ser maior que a menor.");
    const o = (B - bb) / 2;
    W = B + o + bb; H = h;
    formas.push({ tipo: "poli", pontos: [[0, h], [B, h], [o + bb, 0], [o, 0]], estilo: "area" });
    formas.push({ tipo: "poli", pontos: [[o + bb, 0], [B + o + bb, 0], [B + bb, h], [B, h]], estilo: "celula", oculta: true, id: id + "_t2" });
    formas.push({ tipo: "linha", x1: o, y1: 0, x2: o, y2: h, estilo: "tracejado" });
    formas.push({ tipo: "texto", x: o + 0.03 * B, y: h / 2, t: `h = ${sufixo("altura")}`, tam: 28, cor: "yellow", ancora: "inicio" });
    cotas.push({ de: [0, h], ate: [B, h], lado: "baixo", texto: `B = ${sufixo("baseMaior")}` });
    cotas.push({ de: [o, 0], ate: [o + bb, 0], lado: "cima", texto: `b = ${sufixo("baseMenor")}` });
    formula = "A = (B + b) × h / 2"; valores = { B: m.baseMaior, b: m.baseMenor, h: m.altura };
    medidasTxt = [`base maior B = ${sufixo("baseMaior")}`, `base menor b = ${sufixo("baseMenor")}`, `altura h = ${sufixo("altura")}`];
    animacao = { tipo: "trapezio", id: id + "_t2" };
    nomeForma = "trapézio";
  } else {
    throw new Error(`Figura "${forma}" ainda não existe (use retangulo, quadrado, paralelogramo, triangulo ou trapezio).`);
  }
  const unidades = { A: areaUn, b: un, h: un, l: un, B: un };
  return { W, H, formas, cotas, formula, valores, unidades, medidasTxt, gradeOk, animacao, nomeForma, dim: dimBH };
}
const paraN = (fr) => M.paraNumero(fr);

/* ------------------------------------------------------------------ */
/* compilação                                                          */
/* ------------------------------------------------------------------ */
export function compilarAula(planoBruto, { assinatura = "" } = {}) {
  const plano = normalizarPlano(planoBruto);
  const erros = [];
  const avisos = [...plano.avisos];
  const duvidas = [...plano.duvidas];
  const resumo = []; // o que o professor vê na conferência
  const passos = [];
  const termos = {};
  let cena = [];
  let guardar = [];
  let faixaAtual = null, faixaMomento = -1;
  let seq = 0;
  const nid = (p) => p + ++seq;
  let blocoAtual = null, iBloco = 0;
  const erro = (m) => erros.push(`Bloco ${iBloco} (${blocoAtual?.tipo || "aula"}): ${m}`);
  const aviso = (m) => avisos.push(`Bloco ${iBloco} (${blocoAtual?.tipo || "aula"}): ${m}`);

  if (!plano.titulo) erros.push("A aula precisa de um título.");
  // ---------- termos ----------
  plano.termos.forEach((t) => {
    const secoes = [];
    const pedaco = (rotulo, linhas) => {
      if (!linhas.length) return;
      const ls = linhas.flatMap((l) => quebrar(l, 33));
      secoes.push({ rotulo, linhas: ls.slice(0, 3) });
    };
    pedaco("O QUE É", t.oQueE); pedaco("EXPLICANDO", t.explicando); pedaco("EXEMPLO", t.exemplo);
    const totalLinhas = secoes.reduce((s, x) => s + x.linhas.length, 0);
    if (totalLinhas > 7) aviso(`o cartão da palavra "${t.chip}" ficou grande; confira se cabe.`);
    termos[t.chave] = { chip: t.chip, titulo: t.titulo, secoes };
  });

  // ---------- abertura ----------
  const ab = plano.abertura;
  let respostaAbertura = null; // {letra, texto}
  let jaRevelou = false;
  let momentoMax = 0;
  const inicio = { acoes: [], legenda: "Vote com a turma: *qual vocês acham?*" };
  if (!ab || !ab.antes || !ab.destaque || !ab.depois) erros.push("A abertura (pergunta com votação) está incompleta.");
  else if (ab.alternativas.length !== 4) erros.push("A abertura precisa de exatamente 4 alternativas.");
  else {
    let correta = ab.correta;
    if (ab.calculo) {
      try {
        const v = M.avaliar(ab.calculo);
        const r = alternativaCerta(ab.alternativas, v);
        if (r.indice != null) {
          if (correta != null && correta !== r.indice) avisos.push(`Na abertura, a IA marcou a alternativa ${LETRAS[correta]}, mas a conta (${bonita(ab.calculo)} = ${M.formatar(v)}) aponta a ${LETRAS[r.indice]}. Usei a ${LETRAS[r.indice]}.`);
          correta = r.indice;
        } else duvidas.push(`Não consegui achar sozinho qual alternativa da abertura tem o valor ${M.formatar(v)}. Confira a alternativa certa.`);
      } catch (e) { avisos.push(`Abertura: não consegui calcular "${ab.calculo}" (${e.message}).`); }
    }
    if (correta == null) erros.push("Não sei qual é a alternativa correta da abertura.");
    else {
      inicio.acoes.push({ tipo: "pergunta", antes: ab.antes, destaque: ab.destaque, depois: ab.depois, alternativas: ab.alternativas, correta });
      respostaAbertura = { letra: LETRAS[correta], texto: ab.alternativas[correta] };
    }
    if (ab.legenda) inicio.legenda = ab.legenda;
  }
  cena = ["pergunta"];

  // ---------- passos ----------
  const registrar = (id) => { cena.push(id); };
  function novoPasso(momento, { limpar = true, manterFaixa = true } = {}) {
    if (momento !== faixaMomento) manterFaixa = false; // o problema do topo só dura o momento em que foi apresentado
    const p = { momento, acoes: [] };
    if (guardar.length) { p.acoes.push({ tipo: "guardar", chave: guardar.shift() }); }
    if (limpar) {
      const alvos = cena.filter((id) => !(manterFaixa && id === faixaAtual));
      if (!manterFaixa && faixaAtual && alvos.includes(faixaAtual)) faixaAtual = null;
      if (alvos.length) {
        const a = { tipo: "sai", alvos: alvos.slice(), efeito: alvos[0] === "pergunta" ? "sobe" : undefined };
        if (p.acoes.length) a.junto = true;
        p.acoes.push(a);
        cena = cena.filter((id) => !alvos.includes(id));
      }
    }
    passos.push(p);
    return p;
  }
  function push(p, acao, { sequencial = false } = {}) {
    const primeiroConteudo = !p.acoes.some((x) => x.tipo !== "sai" && x.tipo !== "guardar");
    if (!sequencial && primeiroConteudo && p.acoes.length) { acao.junto = true; acao.atraso = 0.2; }
    p.acoes.push(acao);
    return acao;
  }
  const legendaEm = (p, t) => { if (t) push(p, { tipo: "legenda", t, junto: true, atraso: 0.3 }, { sequencial: true }); };
  function linhasFlow(x, y0, itens, { maxChars } = {}) {
    let y = y0;
    const out = [];
    itens.forEach((it) => {
      const tam = it.tam || 42;
      const partes = it.quebrar === false ? [it.t] : quebrar(it.t, maxChars || Math.floor(((1540 - x) * 0.92) / (tam * 0.56)));
      partes.forEach((pt, k) => {
        out.push({ ...it, t: pt, tam, x, y: Math.round(y) });
        y += it.avanco != null ? it.avanco : tam * 1.5;
      });
      y += it.depois || 0;
    });
    return out;
  }

  plano.blocos.forEach((bl, idx) => {
    iBloco = idx + 1; blocoAtual = bl;
    if (bl.momento < momentoMax) bl.momento = momentoMax; // o quadro de progresso só anda para a frente
    momentoMax = bl.momento;
    const info = { n: iBloco, tipo: bl.tipo, momento: bl.momento, fonte: bl.fonte || "", complemento: bl.complemento, resumo: "", contas: [] };
    if (bl.complemento) avisos.push(`Bloco ${iBloco} (${bl.tipo}): conteúdo que NÃO está no material (a IA acrescentou). Confira antes de aprovar.`);
    try {
      if (bl.tipo === "ideia") {
        if (!bl.titulo && !bl.linhas.length && !bl.destaque) throw new Error("bloco vazio");
        const p = novoPasso(bl.momento);
        const id = nid("i");
        const itens = [];
        if (bl.titulo) itens.push({ t: bl.titulo, tam: 50, neg: true, cor: "yellow", depois: 14 });
        bl.linhas.forEach((l) => itens.push({ t: l, tam: 42 }));
        const flow = linhasFlow(160, 215, itens, { maxChars: 40 });
        if (bl.destaque) flow.push({ t: bl.destaque, tam: 48, neg: true, x: 160, y: (flow.length ? flow[flow.length - 1].y : 200) + 90, caixa: true, quebrar: false });
        push(p, { tipo: "linhas", id, regiao: "T", linhas: flow.map(({ t, tam, neg, cor, x, y, caixa }) => ({ t, tam, neg, cor, x, y, caixa })) });
        registrar(id);
        legendaEm(p, bl.legenda || (bl.destaque ? `Guardem esta ideia: *${bl.destaque}*.` : bl.titulo));
        info.resumo = [bl.titulo, ...bl.linhas, bl.destaque].filter(Boolean).join(" · ");
      } else if (bl.tipo === "termo") {
        if (!termos[bl.chave]) throw new Error(`a palavra "${bl.chave}" não está na lista de termos.`);
        const p = novoPasso(bl.momento);
        push(p, { tipo: "termo", chave: bl.chave });
        legendaEm(p, bl.legenda || `Palavra-chave: *${termos[bl.chave].chip}*.`);
        guardar.push(bl.chave);
        info.resumo = `Cartão da palavra "${termos[bl.chave].chip}"`;
      } else if (bl.tipo === "faixa") {
        if (!bl.antes || !bl.numero) throw new Error("faltou texto ou número");
        const p = novoPasso(bl.momento, { manterFaixa: false });
        const id = nid("fx");
        if (faixaAtual) { /* já saiu no limpar */ }
        push(p, { tipo: "faixa", id, antes: bl.antes, numero: bl.numero, depois: bl.depois || "" });
        faixaAtual = id; faixaMomento = bl.momento; registrar(id);
        legendaEm(p, bl.legenda || "Este é o *problema* de hoje.");
        info.resumo = `${bl.antes} ${bl.numero} ${bl.depois}`.trim();
      } else if (bl.tipo === "conta") {
        let num1;
        try { num1 = M.lerNumero(bl.numero); } catch { throw new Error(`número inválido: ${bl.numero}`); }
        if (!ehPotenciaDe10(bl.fator)) throw new Error(`o fator precisa ser 10, 100, 1000...: ${bl.fator}`);
        const k = bl.fator.replace(/\s/g, "").length - 1;
        const res = bl.op === "mul" ? M.vezes(num1, M.potencia(M.F(10), k)) : M.dividido(num1, M.potencia(M.F(10), k));
        const resTxt = M.formatar(res, { milhar: false });
        const ns = bl.numero.replace(/\s/g, ""), vp = ns.indexOf(","), Dg = ns.replace(",", "").length, pp = vp < 0 ? Dg : vp;
        const slots = bl.op === "mul" ? Math.max(Dg, pp + k) : Math.max(0, k - pp + 1) + Dg;
        if (slots > 9) throw new Error("número grande demais para a conta com vírgula (use expressoes).");
        const p = novoPasso(bl.momento);
        const id = nid("c");
        push(p, { tipo: "conta", fase: "entrar", id, numero: bl.numero.replace(/\s/g, ""), op: bl.op, fator: bl.fator.replace(/\s/g, ""), unidadeDe: bl.unidadeDe, unidadePara: bl.unidadePara, nota: bl.nota, resultado: resTxt });
        push(p, { tipo: "conta", fase: "armar", id });
        registrar(id);
        legendaEm(p, bl.legenda);
        const p2 = novoPasso(bl.momento, { limpar: false });
        push(p2, { tipo: "conta", fase: "resolver", id }, { sequencial: true });
        legendaEm(p2, bl.legenda2 || `Resultado: *${M.formatar(res)} ${bl.unidadePara || ""}*`.trim());
        info.resumo = `${bl.numero} ${bl.op === "mul" ? "×" : "÷"} ${bl.fator} = ${M.formatar(res)}`;
        info.contas.push(info.resumo);
      } else if (bl.tipo === "coluna") {
        let A, B;
        try { A = M.lerNumero(bl.a); B = M.lerNumero(bl.b); } catch { throw new Error("números inválidos na conta armada"); }
        const res = bl.op === "add" ? M.soma(A, B) : M.menos(A, B);
        if (res.n < 0n) throw new Error("o resultado da subtração seria negativo; troque a ordem dos números.");
        const larg = Math.max(digitosInteiros(bl.a), digitosInteiros(bl.b)) + Math.max(casas(bl.a), casas(bl.b));
        if (larg > 7) throw new Error("números grandes demais para a conta armada (use expressoes).");
        if (bl.op === "add" && digitosInteiros(M.formatar(res, { milhar: false })) > Math.max(digitosInteiros(bl.a), digitosInteiros(bl.b))) throw new Error("a soma ganha um algarismo a mais; use expressoes.");
        const resTxt = M.formatar(res, { milhar: false });
        const p = novoPasso(bl.momento);
        const id = nid("col");
        push(p, { tipo: "coluna", id, op: bl.op, a: bl.a.replace(/\s/g, ""), b: bl.b.replace(/\s/g, ""), titulo: bl.titulo || (bl.op === "add" ? "Soma" : "Diferença"), unidade: bl.unidade, x: 694, resultado: resTxt });
        registrar(id);
        legendaEm(p, bl.legenda || (bl.op === "add" ? "*Vírgula embaixo de vírgula.* Somamos da direita para a esquerda." : "*Vírgula embaixo de vírgula.* Subtraímos da direita para a esquerda."));
        if (bl.notas.length) {
          const idn = nid("n");
          const fl = linhasFlow(980, 300, bl.notas.map((t) => ({ t, tam: 34 })), { maxChars: 26 });
          push(p, { tipo: "linhas", id: idn, regiao: "D", linhas: fl.map(({ t, tam, x, y }) => ({ t, tam, x, y, cor: "sky" })) });
          registrar(idn);
        }
        info.resumo = `${bl.a} ${bl.op === "add" ? "+" : "−"} ${bl.b} = ${M.formatar(res)}`;
        info.contas.push(info.resumo);
      } else if (bl.tipo === "expressoes") {
        if (!bl.itens.length) throw new Error("sem contas");
        const linhas = [];
        bl.itens.forEach((it) => {
          let r;
          try { r = M.avaliar(it.expr, { implicita: false }); } catch (e) { throw new Error(`não consegui calcular "${it.expr}" (${e.message})`); }
          const rt = M.formatarComAprox(r);
          const un = it.unidade ? " " + it.unidade : "";
          linhas.push({ item: it, texto: `${it.rotulo ? it.rotulo + " " : ""}${bonita(it.expr)} = *${rt}${un}*`, pergunta: `${it.rotulo ? it.rotulo + " " : ""}${bonita(it.expr)} = ?`, calculado: `${bonita(it.expr)} = ${M.formatar(r)}` });
          info.contas.push(`${bonita(it.expr)} = ${M.formatar(r)}`);
        });
        info.resumo = info.contas.join(" · ");
        const porPasso = bl.passoAPasso ? 1 : linhas.length;
        let yCursor = 230;
        for (let ini = 0; ini < linhas.length; ini += porPasso) {
          const fatia = linhas.slice(ini, ini + porPasso);
          const itensR = [], itensQ = [];
          if (bl.titulo && ini === 0) { const t = { t: bl.titulo, tam: 44, neg: true, cor: "yellow", depois: 12, quebrar: false }; itensR.push(t); itensQ.push(t); }
          fatia.forEach((l) => {
            const tam = l.texto.replace(/\*/g, "").length > 40 ? 44 : 52;
            const av = l.item.nota ? 62 : undefined;
            itensR.push({ t: l.texto, tam, neg: true, depois: 6, avanco: av, quebrar: false });
            itensQ.push({ t: l.pergunta, tam, neg: true, depois: 6, avanco: av, quebrar: false });
            if (l.item.nota) { const n = { t: l.item.nota, tam: 30, cor: "sky", depois: 8, avanco: 56, quebrar: false }; itensR.push(n); itensQ.push(n); }
          });
          const fl = linhasFlow(160, yCursor, itensR);
          const flQ = fl.map((f, i) => ({ ...f, t: itensQ[i].t }));
          if (fl.length) { const u = fl[fl.length - 1]; yCursor = u.y + (u.avanco != null ? u.avanco : u.tam * 1.5) + (u.depois || 0); }
          if (fl.length && fl[fl.length - 1].y > 700) aviso("muitas contas na mesma tela; algumas podem ficar fora do quadro.");
          const cortar = ({ t, tam, neg, cor, x, y }) => ({ t, tam, neg, cor, x, y });
          // 1) a turma vê as contas sem resposta ("= ?")
          const pQ = novoPasso(bl.momento, { limpar: ini === 0 });
          const idQ = nid("e");
          push(pQ, { tipo: "linhas", id: idQ, regiao: "T", linhas: flQ.map(cortar) });
          registrar(idQ);
          legendaEm(pQ, bl.legenda || "Resolvam no caderno e depois *conferimos*.");
          // 2) as mesmas contas, agora com as respostas (calculadas pelo sistema)
          const pR = novoPasso(bl.momento, { limpar: false });
          const idR = nid("e");
          push(pR, { tipo: "sai", alvos: [idQ], dur: 0.25 }, { sequencial: true });
          cena = cena.filter((c) => c !== idQ);
          push(pR, { tipo: "linhas", id: idR, regiao: "T", linhas: fl.map(cortar) });
          registrar(idR);
          legendaEm(pR, bl.legenda2 || "Conferindo as *respostas*.");
        }
      } else if (bl.tipo === "formula") {
        if (!bl.formula) throw new Error("faltou a fórmula");
        const r = M.calcularFormula(bl.formula, bl.valores, bl.unidades);
        const p = novoPasso(bl.momento);
        const id = nid("f");
        const itens = [];
        if (bl.nome) itens.push({ t: bl.nome, tam: 44, neg: true, cor: "yellow", depois: 16 });
        itens.push({ t: r.formula, tam: 64, neg: true, quebrar: false, caixa: true, depois: 30 });
        Object.keys(bl.variaveis).forEach((v) => itens.push({ t: `${v} = ${bl.variaveis[v]}`, tam: 34, cor: "sky" }));
        const fl = linhasFlow(160, 230, itens, { maxChars: 40 });
        push(p, { tipo: "linhas", id, regiao: "T", linhas: fl.map(({ t, tam, neg, cor, x, y, caixa }) => ({ t, tam, neg, cor, x, y, caixa })) });
        registrar(id);
        legendaEm(p, bl.legenda || `A fórmula: *${r.formula.replace(/\//g, "÷")}*.`);
        const p2 = novoPasso(bl.momento, { limpar: false });
        const id2 = nid("f");
        const yBase = (fl.length ? fl[fl.length - 1].y : 300) + 90;
        const un = r.unidade ? " " + r.unidade : "";
        const l2 = [
          { t: r.substituido, tam: 52, x: 160, y: yBase },
          { t: `${r.alvo} = *${r.resultadoTxt}${un}*`, tam: 64, neg: true, x: 160, y: yBase + 84 },
        ];
        if (r.usaPi) l2.push({ t: `(usando π ≈ ${r.pi})`, tam: 28, cor: "dim", x: 160, y: yBase + 140 });
        push(p2, { tipo: "linhas", id: id2, regiao: "T", linhas: l2 }, { sequencial: true });
        registrar(id2);
        legendaEm(p2, bl.legenda2 || "Trocamos as letras pelos números e calculamos.");
        info.resumo = `${r.formula} → ${r.substituido} = ${r.resultadoTxt}${un}`;
        info.contas.push(`${r.substituido} = ${M.formatar(r.resultado)}`);
      } else if (bl.tipo === "figura") {
        const id = nid("fig");
        let g;
        try { g = montarFigura(bl, id); } catch (e) { throw new Error(e.message); }
        const un = bl.unidade;
        const calc = M.calcularFormula(g.formula, g.valores, g.unidades);
        info.contas.push(`${calc.substituido} = ${M.formatar(calc.resultado)}${calc.unidade ? " " + calc.unidade : ""}`);
        info.resumo = `${g.nomeForma}: ${g.medidasTxt.join(", ")} → área ${calc.resultadoTxt} ${calc.unidade}`.trim();
        // escala e posição (região da esquerda: x 100–800, y 200–650)
        const K = Math.max(20, Math.min(560 / g.W, 300 / g.H, 95));
        const ox = 130 + (560 - g.W * K) / 2, oy = 230 + (300 - g.H * K) / 2;
        const formas = g.formas.map((f) => ({ ...f }));
        const textoGrade = [];
        if (g.animacao === "grade" && g.gradeOk && bl.grade) {
          const [b, h] = g.dim;
          for (let i = 1; i < b; i++) { formas.push({ tipo: "linha", x1: i, y1: 0, x2: i, y2: h, estilo: "fino", oculta: true, id: `${id}_gv${i}` }); textoGrade.push(`${id}_gv${i}`); }
          for (let j = 1; j < h; j++) { formas.push({ tipo: "linha", x1: 0, y1: j, x2: b, y2: j, estilo: "fino", oculta: true, id: `${id}_gh${j}` }); textoGrade.push(`${id}_gh${j}`); }
        }
        // passo 1: a figura com as medidas
        const p1 = novoPasso(bl.momento);
        push(p1, { tipo: "figura", id, origem: [Math.round(ox), Math.round(oy)], escala: Math.round(K * 10) / 10, formas, cotas: g.cotas });
        registrar(id);
        const idm = nid("m");
        const fm = linhasFlow(900, 250, [{ t: "Medidas", tam: 34, neg: true, cor: "dim", depois: 8 }, ...g.medidasTxt.map((t) => ({ t, tam: 44, neg: true }))], { maxChars: 26 });
        push(p1, { tipo: "linhas", id: idm, regiao: "D", linhas: fm.map(({ t, tam, neg, cor, x, y }) => ({ t, tam, neg, cor, x, y })) });
        registrar(idm);
        legendaEm(p1, bl.legendas[0] || `Um ${g.nomeForma}: estas são as medidas.`);
        // passo 2: a ideia da área (grade de quadradinhos ou transformação)
        const p2 = novoPasso(bl.momento, { limpar: false });
        let leg2 = bl.legendas[1];
        if (g.animacao === "grade" && textoGrade.length) {
          textoGrade.forEach((tid, i) => push(p2, { tipo: "mostrar", alvo: tid, dur: 0.35, junto: i > 0 }, { sequencial: true }));
          const lado1 = bl.forma === "quadrado" ? bl.medidas.lado : bl.medidas.base, lado2 = bl.forma === "quadrado" ? bl.medidas.lado : bl.medidas.altura;
          const idq = nid("q");
          const total = M.formatar(M.vezes(M.lerNumero(lado1), M.lerNumero(lado2)));
          push(p2, { tipo: "linhas", id: idq, regiao: "D", linhas: [{ t: `${lado1} × ${lado2} = *${total}* quadradinhos`, tam: 40, neg: true, x: 900, y: 500, cor: "sky" }] }, { sequencial: true });
          registrar(idq);
          leg2 = leg2 || "A área é quantos quadradinhos *cabem* na figura.";
        } else if (g.animacao && g.animacao.tipo === "paralelogramo") {
          push(p2, { tipo: "mostrar", alvo: g.animacao.id, op: 0.85, dur: 0.4 }, { sequencial: true });
          push(p2, { tipo: "mover", alvo: g.animacao.id, x: Math.round(g.animacao.dx * K), dur: 1.3, atraso: 0.4 }, { sequencial: true });
          leg2 = leg2 || "Cortamos o triângulo e encaixamos do outro lado: vira um *retângulo*.";
        } else if (g.animacao && g.animacao.tipo === "triangulo") {
          push(p2, { tipo: "mostrar", alvo: g.animacao.id, op: 0.85, dur: 0.8 }, { sequencial: true });
          leg2 = leg2 || "Dois triângulos iguais formam um paralelogramo. Cada um é *metade*.";
        } else if (g.animacao && g.animacao.tipo === "trapezio") {
          push(p2, { tipo: "mostrar", alvo: g.animacao.id, op: 0.85, dur: 0.8 }, { sequencial: true });
          leg2 = leg2 || "Dois trapézios iguais formam um paralelogramo de base *B + b*.";
        }
        legendaEm(p2, leg2 || "Vamos calcular a área.");
        // passo 3: fórmula (as medidas e a contagem saem para dar lugar à conta)
        const p3 = novoPasso(bl.momento, { limpar: false });
        const saem = cena.filter((cid) => cid === idm || cid.startsWith("q"));
        if (saem.length) { push(p3, { tipo: "sai", alvos: saem, dur: 0.35 }, { sequencial: true }); cena = cena.filter((cid) => !saem.includes(cid)); }
        const id3 = nid("fr");
        const un3 = calc.unidade ? " " + calc.unidade : "";
        const fl3 = [
          { t: "Fórmula", tam: 32, neg: true, cor: "dim", x: 900, y: 235 },
          { t: g.formula.replace(/\//g, "÷"), tam: 56, neg: true, x: 900, y: 305 },
          { t: calc.substituido, tam: 46, x: 900, y: 395 },
          { t: `A = *${calc.resultadoTxt}${un3}*`, tam: 60, neg: true, x: 900, y: 490 },
        ];
        push(p3, { tipo: "linhas", id: id3, regiao: "D", linhas: fl3 }, { sequencial: true });
        registrar(id3);
        legendaEm(p3, bl.legendas[2] || `A área do ${g.nomeForma} é *${calc.resultadoTxt}${un3}*.`);
        void un;
      } else if (bl.tipo === "equacao") {
        if (!bl.equacao) throw new Error("faltou a equação");
        const r = M.resolverEquacao(bl.equacao);
        if (!r.ok) throw new Error("a conferência da equação não fechou");
        info.resumo = `${bl.equacao} → ${r.variavel} = ${M.formatar(r.solucao)}`;
        info.contas.push(`${bl.equacao}: ${r.variavel} = ${M.formatar(r.solucao)} (conferido)`);
        const passosEq = r.passos.filter((s) => !s.conferencia);
        const conf = r.passos.find((s) => s.conferencia);
        const idBase = nid("eq");
        passosEq.forEach((s, i) => {
          const p = novoPasso(bl.momento, { limpar: i === 0 });
          const id = `${idBase}_${i}`;
          const y = (passosEq.length > 4 ? 282 : 300) + i * (passosEq.length > 4 ? 76 : 92);
          const tamEq = passosEq.length > 4 ? 56 : 64;
          const ls = [];
          if (i === 0) ls.push({ t: bl.titulo || "Resolvendo a equação", tam: 40, neg: true, cor: "yellow", x: 160, y: 220 });
          ls.push({ t: s.texto, tam: tamEq, neg: true, x: 160, y });
          if (i === passosEq.length - 1 && conf) ls.push({ t: conf.texto, tam: 34, cor: "sky", x: 160, y: y + 70 });
          push(p, { tipo: "linhas", id, regiao: "T", linhas: ls });
          registrar(id);
          legendaEm(p, i === 0 && bl.legenda ? bl.legenda : (s.resultado ? `Resposta: *${r.variavel} = ${M.formatar(r.solucao)}*` : s.nota));
        });
      } else if (bl.tipo === "desafio") {
        if (!bl.enunciado.length) throw new Error("faltou o enunciado");
        let valor = null;
        if (bl.calculo) { try { valor = M.avaliar(bl.calculo); } catch (e) { throw new Error(`não consegui calcular "${bl.calculo}" (${e.message})`); } }
        const p = novoPasso(bl.momento);
        const id = nid("d");
        const fl = linhasFlow(160, 205, bl.enunciado.map((t) => ({ t, tam: 40 })), { maxChars: 44 });
        push(p, { tipo: "linhas", id, regiao: "T", linhas: fl.map(({ t, tam, x, y }) => ({ t, tam, x, y })) });
        registrar(id);
        let indiceCerto = bl.correta;
        if (bl.alternativas.length === 4) {
          const yAlt = (fl.length ? fl[fl.length - 1].y : 200) + 70;
          const ida = nid("a");
          push(p, { tipo: "alternativas", id: ida, x: 160, y: Math.min(yAlt, 480), w: 660, h: 84, titulo: [], itens: bl.alternativas.map((t, i) => [LETRAS[i], t]) }, { sequencial: true });
          registrar(ida);
          if (valor) {
            const r = alternativaCerta(bl.alternativas, valor);
            if (r.indice != null) {
              if (indiceCerto != null && indiceCerto !== r.indice) avisos.push(`Bloco ${iBloco}: a IA marcou a alternativa ${LETRAS[indiceCerto]}, mas a conta dá ${M.formatar(valor)} (alternativa ${LETRAS[r.indice]}). Usei a ${LETRAS[r.indice]}.`);
              indiceCerto = r.indice;
            } else duvidas.push(`Bloco ${iBloco}: não achei sozinho a alternativa com o valor ${M.formatar(valor)}. Confira qual é a certa.`);
          }
        }
        legendaEm(p, bl.legenda || "*Sua vez!* Resolvam no caderno.");
        if (valor || indiceCerto != null) {
          const p2 = novoPasso(bl.momento, { limpar: false });
          const id2 = nid("d");
          const un = bl.unidade ? " " + bl.unidade : "";
          const ls = [];
          if (bl.calculo) ls.push({ t: `${bonita(bl.calculo)} = *${M.formatar(valor)}${un}*`, tam: 40, neg: true, x: 160, y: 716 });
          if (indiceCerto != null && bl.alternativas.length === 4) ls.push({ t: `Alternativa ${LETRAS[indiceCerto]} ✓`, tam: 40, neg: true, cor: "ok", x: 1080, y: 716 });
          if (ls.length) { push(p2, { tipo: "linhas", id: id2, regiao: "D", linhas: ls }, { sequencial: true }); registrar(id2); }
          legendaEm(p2, bl.legenda2 || (indiceCerto != null ? `Resposta: alternativa *${LETRAS[indiceCerto]}* ✓` : "Vamos conferir a resposta."));
        }
        info.resumo = `${bl.enunciado.join(" ")}${valor ? " → " + M.formatar(valor) : ""}`;
        if (valor) info.contas.push(`${bonita(bl.calculo)} = ${M.formatar(valor)}`);
      } else if (bl.tipo === "revelar") {
        if (!respostaAbertura) throw new Error("não há pergunta de abertura para revelar");
        if (jaRevelou) { aviso("a resposta da abertura já foi revelada antes; este bloco repetido foi ignorado."); info.resumo = "(repetido, ignorado)"; resumo.push(info); return; }
        jaRevelou = true;
        const p = novoPasso(bl.momento);
        const id = nid("r");
        push(p, { tipo: "cartao", id, estilo: "ok", x: 400, y: 230, w: 800, rx: 24, entrada: "sobe", comVoto: true, linhas: [{ t: "RESPOSTA", tam: 30, cor: "dim", neg: true, ls: true, dy: 56 }, { t: `${respostaAbertura.letra}  ·  ${respostaAbertura.texto}`, tam: 60, cor: "ok", neg: true, dy: 140 }] });
        registrar(id);
        legendaEm(p, bl.legenda || "Confere com o que a turma achou? ✓");
        info.resumo = `Resposta da abertura: ${respostaAbertura.letra} · ${respostaAbertura.texto}`;
      } else if (bl.tipo === "fecho") {
        if (!bl.regra.length) throw new Error("faltou a regra do dia");
        const p = novoPasso(bl.momento, { manterFaixa: false });
        faixaAtual = null;
        const id1 = nid("regra");
        const ls1 = [{ t: bl.titulo || "REGRA DE HOJE", tam: 38, cor: "yellow", neg: true, ls: true, dy: 68 }];
        let dy = 150;
        bl.regra.forEach((t, i) => { ls1.push({ t, tam: i === 0 ? 54 : 38, neg: i === 0, cor: i === 0 ? "chalk" : "sky", dy }); dy += i === 0 ? 84 : 64; });
        const dyFim = (linhas) => Math.max(...linhas.map((l) => l.dy || 0));
        const dyPega = bl.pega.length ? 140 + 62 * (bl.pega.length - 1) : 0;
        const altura = Math.min(570, Math.max(330, Math.max(dyFim(ls1), dyPega) + 90));
        push(p, { tipo: "cartao", id: id1, estilo: "box", camada: "fecho", x: 80, y: 170, w: 680, h: altura, rx: 26, padX: 40, linhas: ls1 });
        registrar(id1);
        if (bl.pega.length) {
          const id2 = nid("pega");
          const ls2 = [{ t: bl.pegaTitulo || "CUIDADO: PEGADINHA", tam: 38, cor: "coral", neg: true, ls: true, dy: 68 }];
          let dy2 = 140;
          bl.pega.forEach((t, i) => { ls2.push({ t, tam: i === 0 ? 40 : 34, neg: i === 0, cor: i === 0 ? "chalk" : "dim", dy: dy2 }); dy2 += 62; });
          push(p, { tipo: "cartao", id: id2, estilo: "coral", camada: "fecho", x: 840, y: 170, w: 680, h: altura, rx: 26, padX: 40, atraso: 0.25, linhas: ls2 });
          registrar(id2);
        }
        push(p, { tipo: "assinatura", junto: true, atraso: 0.6 }, { sequencial: true });
        legendaEm(p, bl.legenda || "Para levar: *a regra e a pegadinha*.");
        info.resumo = [bl.titulo, ...bl.regra].filter(Boolean).join(" · ");
      }
    } catch (e) {
      erro(e.message);
    }
    resumo.push(info);
  });
  blocoAtual = null; iBloco = 0;

  // sem "fecho"? não deixa a aula sem final
  if (!plano.blocos.some((b) => b.tipo === "fecho")) avisos.push("A aula não tem o bloco de fechamento (regra do dia).");
  if (passos.length < 5) erros.push("A aula ficou curta demais (menos de 5 passos).");
  if (passos.length > 45) erros.push("A aula ficou longa demais (mais de 45 passos).");
  // toda palavra do glossário usada?
  // palavras da lista que nenhum bloco apresenta simplesmente não entram na aula
  Object.keys(termos).forEach((k) => { if (!plano.blocos.some((b) => b.tipo === "termo" && b.chave === k)) delete termos[k]; });

  const aula = { titulo: plano.titulo, assinatura, termos, inicio, passos };
  return { aula, plano, relatorio: { erros, avisos, duvidas, blocos: resumo } };
}
