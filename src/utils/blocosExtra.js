// Blocos da Etapa 4: fração, gráfico de função e movimento (Física).
// Funções PURAS: recebem o bloco do plano e devolvem uma "cena" (formas, textos, passos).
// Toda conta é feita aqui com aritmética exata (matematicaExata.js); a IA nunca calcula.
// O compilador (compiladorAula.js) só transforma a cena em passos do motor.
import * as M from "./matematicaExata.js";

const mdc = (a, b) => (b === 0 ? a : mdc(b, a % b));
const mmc = (a, b) => (a / mdc(a, b)) * b;
const fmtNum = (n) => String(n).replace(".", ",");
const bonita = (t) => String(t).replace(/\*/g, "×").replace(/\//g, "÷").replace(/(?<=\s)-(?=\s)/g, "−").replace(/\(-/g, "(−").replace(/\s+/g, " ").trim();

// texto da coluna da direita (x = 900), com y calculado
function lin(itens, y0 = 250) {
  let y = y0;
  return itens.map((it) => {
    const tam = it.tam || 42;
    const o = { t: it.t, tam, neg: it.neg !== false, cor: it.cor, x: 900, y: Math.round(y) };
    y += tam * 1.5 + (it.depois || 0);
    return o;
  });
}

/* ------------------------------------------------------------------ */
/* FRAÇÃO (barras)                                                     */
/* ------------------------------------------------------------------ */
function fr(txt, nome) {
  const m = /^\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*$/.exec(String(txt || ""));
  if (!m) throw new Error(`A fração "${nome}" precisa estar no formato 3/4.`);
  const n = Number(m[1]), d = Number(m[2]);
  if (d < 1 || d > 24) throw new Error(`O denominador de "${txt}" precisa ficar entre 1 e 24.`);
  if (n < 1) throw new Error(`O numerador de "${txt}" precisa ser pelo menos 1.`);
  if (n > d) throw new Error(`Por enquanto só frações até 1 inteiro (numerador não maior que o denominador): "${txt}".`);
  return { n, d };
}
const T = (n, d) => `${n}/${d}`;

const BW = 560, BH = 62, PASSO = 150;
// barras: [{d, n, rotulo, pintar: "ja"|"depois"}] -> { formas, ids: [[ids das partes pintadas por barra]] }
function barrasFormas(id, barras) {
  const formas = [], pintadas = [];
  barras.forEach((b, r) => {
    const y0 = 40 + r * PASSO, cw = BW / b.d;
    for (let i = 0; i < b.d; i++) formas.push({ tipo: "ret", x: i * cw, y: y0, w: cw, h: BH, estilo: "area" });
    const ids = [];
    for (let i = 0; i < b.n; i++) {
      const f = { tipo: "ret", x: i * cw + 4, y: y0 + 4, w: cw - 8, h: BH - 8, estilo: "celula" };
      if (b.pintar === "depois") { f.oculta = true; f.id = `${id}_r${r}c${i}`; ids.push(f.id); }
      formas.push(f);
    }
    pintadas.push(ids);
    formas.push({ tipo: "texto", x: BW / 2, y: y0 - 14, t: b.rotulo, tam: 32, cor: "yellow" });
  });
  return { formas, pintadas };
}
const figuraBarras = (id, barras) => {
  const { formas, pintadas } = barrasFormas(id, barras);
  return { fig: { id, origem: [130, 235], escala: 1, formas }, pintadas };
};
const mostrarTodas = (ids) => ids.map((alvo, i) => ({ tipo: "mostrar", alvo, dur: 0.25, junto: i > 0 }));

export function fracaoCena(bl, id) {
  const op = bl.op || "representar";
  const passos = [];
  const contas = [];
  let resumo = "";
  if (op === "representar") {
    const a = fr(bl.a, "a");
    const { fig, pintadas } = figuraBarras(id, [{ d: a.d, n: a.n, rotulo: `${a.d} partes iguais`, pintar: "depois" }]);
    passos.push({
      figura: fig,
      linhas: lin([{ t: "Fração", tam: 32, cor: "dim", depois: 14 }, { t: `${a.d} partes iguais`, tam: 44 }, { t: `cada parte é 1/${a.d}`, tam: 38, cor: "sky" }]),
      legenda: bl.legenda || `O inteiro foi dividido em *${a.d} partes iguais*.`,
    });
    const v = M.dividido(M.F(BigInt(a.n)), M.F(BigInt(a.d)));
    const itens = [{ t: `${a.n} partes pintadas`, tam: 44 }, { t: `Fração: ${T(a.n, a.d)}`, tam: 56, cor: "yellow" }];
    if (a.d > 1 && M.ehDecimalExato(v)) { itens.push({ t: `${T(a.n, a.d)} = ${M.formatar(v)}`, tam: 42, cor: "sky" }); contas.push(`${T(a.n, a.d)} = ${M.formatar(v)}`); }
    passos.push({ acoes: mostrarTodas(pintadas[0]), tiraLinhas: true, linhas: lin(itens), legenda: bl.legenda2 || `Pintamos *${a.n}* das *${a.d}* partes: é a fração *${T(a.n, a.d)}*.` });
    resumo = `fração ${T(a.n, a.d)} em ${a.d} partes iguais`;
  } else if (op === "equivalente") {
    const a = fr(bl.a, "a");
    const k = Number.parseInt(bl.fator, 10);
    if (!Number.isFinite(k) || k < 2 || k > 8) throw new Error('O "fator" da fração equivalente precisa ser um inteiro de 2 a 8.');
    if (a.d * k > 24) throw new Error(`Com fator ${k} o denominador passaria de 24 (${a.d * k}); use um fator menor.`);
    const b = { n: a.n * k, d: a.d * k };
    passos.push({
      figura: figuraBarras(id, [{ d: a.d, n: a.n, rotulo: T(a.n, a.d), pintar: "ja" }]).fig,
      linhas: lin([{ t: "Fração", tam: 32, cor: "dim", depois: 14 }, { t: T(a.n, a.d), tam: 64, cor: "yellow" }]),
      legenda: bl.legenda || `Esta é a fração *${T(a.n, a.d)}*.`,
    });
    const g2 = figuraBarras(id + "b", [{ d: a.d, n: a.n, rotulo: T(a.n, a.d), pintar: "ja" }, { d: b.d, n: b.n, rotulo: T(b.n, b.d), pintar: "depois" }]);
    passos.push({
      limpar: true,
      figura: g2.fig,
      acoes: mostrarTodas(g2.pintadas[1]),
      linhas: lin([{ t: `${a.n} × ${k} = ${b.n}`, tam: 46 }, { t: `${a.d} × ${k} = ${b.d}`, tam: 46 }, { t: `${T(a.n, a.d)} = ${T(b.n, b.d)}`, tam: 60, cor: "yellow", depois: 10 }]),
      legenda: bl.legenda2 || "Multiplicando *em cima e embaixo* pelo mesmo número, a fração vale o mesmo.",
    });
    contas.push(`${a.n} × ${k} = ${b.n}`, `${a.d} × ${k} = ${b.d}`, `${T(a.n, a.d)} = ${T(b.n, b.d)}`);
    resumo = `${T(a.n, a.d)} = ${T(b.n, b.d)} (fator ${k})`;
  } else {
    const soma = op === "soma";
    const a = fr(bl.a, "a"), b = fr(bl.b, "b");
    const L = a.d === b.d ? a.d : mmc(a.d, b.d);
    if (L > 24) throw new Error(`O denominador comum (${L}) passa de 24; escolha frações com denominadores menores.`);
    const na = (a.n * L) / a.d, nb = (b.n * L) / b.d;
    const r = soma ? na + nb : na - nb;
    if (soma && r > L) throw new Error(`A soma dá mais de 1 inteiro (${T(r, L)}); por enquanto só somas até 1 inteiro.`);
    if (!soma && r < 1) throw new Error(`A subtração precisa dar um resultado positivo (${T(na, L)} − ${T(nb, L)}).`);
    const sinal = soma ? "+" : "−";
    const verbo = soma ? "somar" : "subtrair";
    passos.push({
      figura: figuraBarras(id, [{ d: a.d, n: a.n, rotulo: T(a.n, a.d), pintar: "ja" }, { d: b.d, n: b.n, rotulo: T(b.n, b.d), pintar: "ja" }]).fig,
      linhas: lin([{ t: `${T(a.n, a.d)} ${sinal} ${T(b.n, b.d)} = ?`, tam: 56, cor: "yellow" }]),
      legenda: bl.legenda || `Vamos *${verbo}* duas frações.`,
    });
    if (a.d !== b.d) {
      const itens = [{ t: `Denominador comum: ${L}`, tam: 40, cor: "sky", depois: 8 }];
      if (a.d !== L) { itens.push({ t: `${T(a.n, a.d)} = ${T(na, L)}`, tam: 48 }); contas.push(`${T(a.n, a.d)} = ${T(na, L)}`); }
      if (b.d !== L) { itens.push({ t: `${T(b.n, b.d)} = ${T(nb, L)}`, tam: 48 }); contas.push(`${T(b.n, b.d)} = ${T(nb, L)}`); }
      passos.push({
        limpar: true,
        figura: figuraBarras(id + "b", [{ d: L, n: na, rotulo: T(na, L), pintar: "ja" }, { d: L, n: nb, rotulo: T(nb, L), pintar: "ja" }]).fig,
        linhas: lin(itens),
        legenda: bl.legenda2 || `Para ${verbo}, os *denominadores* precisam ser iguais: usamos *${L}*.`,
      });
    }
    const g3 = figuraBarras(id + "c", [{ d: L, n: na, rotulo: T(na, L), pintar: "ja" }, { d: L, n: nb, rotulo: T(nb, L), pintar: "ja" }, { d: L, n: r, rotulo: T(r, L), pintar: "depois" }]);
    const conta = `${T(na, L)} ${sinal} ${T(nb, L)} = ${T(r, L)}`;
    const itens = [{ t: conta, tam: 46, cor: "yellow" }];
    contas.push(conta);
    const g = mdc(r, L);
    if (g > 1) { const s = r === L ? "1" : T(r / g, L / g); itens.push({ t: `${T(r, L)} = ${s}`, tam: 46, cor: "sky" }); contas.push(`${T(r, L)} = ${s}`); }
    passos.push({
      limpar: true,
      figura: g3.fig,
      acoes: mostrarTodas(g3.pintadas[2]),
      linhas: lin([...itens, { t: soma ? "Somamos só os numeradores." : "Subtraímos só os numeradores.", tam: 34, neg: false, cor: "dim" }]),
      legenda: bl.legenda3 || `Com o mesmo denominador, é só ${verbo} os numeradores: *${T(r, L)}*.`,
    });
    resumo = `${T(a.n, a.d)} ${sinal} ${T(b.n, b.d)} = ${T(r, L)}${g > 1 ? " = " + (r === L ? "1" : T(r / g, L / g)) : ""}`;
  }
  return { passos, resumo, contas, nome: "fração" };
}

/* ------------------------------------------------------------------ */
/* GRÁFICO DE FUNÇÃO                                                   */
/* ------------------------------------------------------------------ */
function substituir(rhs, xv) {
  const v = xv.startsWith("-") ? `(${xv})` : xv;
  return bonita(String(rhs).replace(/(\d)\s*x/g, "$1 × x").replace(/x/g, v));
}
function passoNice(span) {
  for (const p of [1, 2, 5, 10, 20, 50, 100, 200, 500]) if (span / p <= 8) return p;
  return 1000;
}

export function graficoCena(bl, id) {
  const m = /^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)$/i.exec(String(bl.funcao || ""));
  if (!m) throw new Error('A função precisa estar no formato "y = 2x + 1".');
  const rhs = m[1].trim();
  let xmin = bl.xmin != null ? bl.xmin : -3, xmax = bl.xmax != null ? bl.xmax : 3;
  xmin = Math.min(xmin, 0); xmax = Math.max(xmax, 0);
  if (xmax - xmin < 2) { xmin = -3; xmax = 3; }
  if (xmax - xmin > 12) throw new Error("O gráfico aceita no máximo 12 unidades no eixo x.");
  const val = (x) => {
    try { return M.avaliar(rhs, { vars: { x: fmtNum(x) }, implicita: true }); }
    catch (e) { throw new Error(`A função não pôde ser calculada em x = ${fmtNum(x)} (${e.message}).`); }
  };
  const inteiros = [];
  for (let x = xmin; x <= xmax; x++) inteiros.push(x);
  const ys = inteiros.map((x) => val(x));
  const yf = ys.map((y) => M.paraNumero(y));
  if (yf.some((y) => !Number.isFinite(y) || Math.abs(y) > 1000)) throw new Error("Os valores de y ficaram grandes demais (máximo 1000); escolha outro intervalo de x.");
  let ymin = Math.min(0, ...yf), ymax = Math.max(0, ...yf);
  // curva (linear = 2 pontos; o resto = pontos de 0,25 em 0,25)
  let linear = null;
  try { linear = M.avaliarLinear(rhs, { incognita: "x", implicita: true }); } catch { linear = null; }
  const pontosCurva = [];
  if (linear) { pontosCurva.push([xmin, M.paraNumero(val(xmin))], [xmax, M.paraNumero(val(xmax))]); }
  else for (let x = xmin; x <= xmax + 1e-9; x += 0.25) { const y = M.paraNumero(val(x)); if (Math.abs(y) > 1000) throw new Error("Os valores de y ficaram grandes demais."); pontosCurva.push([x, y]); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  if (ymax - ymin < 1e-9) throw new Error("A função é sempre zero; escolha outra.");
  // a linha reta pode sair do intervalo de y sem ser amostrada: já contamos as pontas em yf
  const yt = Math.floor(ymin - 1e-9), ya = Math.ceil(ymax + 1e-9);
  const Sx = Math.min(80, 620 / (xmax - xmin)), Sy = Math.min(70, 340 / (ya - yt)); // escalas separadas: o gráfico ocupa bem o espaço
  const w = (xmax - xmin) * Sx, h = (ya - yt) * Sy;
  const ox = 130 + (620 - w) / 2, oy = 215 + (360 - h) / 2;
  const X = (x) => Math.round((x - xmin) * Sx * 10) / 10, Y = (y) => Math.round((ya - y) * Sy * 10) / 10;
  const formas = [];
  for (const x of inteiros) if (x !== 0) formas.push({ tipo: "linha", x1: X(x), y1: 0, x2: X(x), y2: h, estilo: "fino" });
  const py = passoNice(ya - yt);
  for (let y = Math.ceil(yt / py) * py; y <= ya; y += py) if (y !== 0) formas.push({ tipo: "linha", x1: 0, y1: Y(y), x2: w, y2: Y(y), estilo: "fino" });
  formas.push({ tipo: "linha", x1: 0, y1: Y(0), x2: w, y2: Y(0), estilo: "traco" });
  formas.push({ tipo: "linha", x1: X(0), y1: 0, x2: X(0), y2: h, estilo: "traco" });
  formas.push({ tipo: "texto", x: w + 18, y: Y(0) + 8, t: "x", tam: 30, cor: "yellow" });
  formas.push({ tipo: "texto", x: X(0) + 20, y: -8, t: "y", tam: 30, cor: "yellow" });
  const passoX = inteiros.length > 9 ? 2 : 1;
  for (const x of inteiros) if (x !== 0 && x % passoX === 0) formas.push({ tipo: "texto", x: X(x), y: Y(0) + 30, t: String(x).replace("-", "−"), tam: 22, cor: "dim" });
  for (let y = Math.ceil(yt / py) * py; y <= ya; y += py) if (y !== 0) formas.push({ tipo: "texto", x: X(0) - 22, y: Y(y) + 8, t: String(y).replace("-", "−"), tam: 22, cor: "dim", ancora: "fim" });
  const idCurva = id + "_curva";
  formas.push({ tipo: "curva", pontos: pontosCurva.map(([x, y]) => [X(x), Y(y)]), estilo: "tracoY", id: idCurva, tracar: true });

  // tabela: até 5 valores de x
  const alvoX = inteiros.length <= 5 ? inteiros : [xmin, Math.round(xmin / 2), 0, Math.round(xmax / 2), xmax].filter((v, i, a) => a.indexOf(v) === i);
  const linhasTab = [], idsPontos = [], contas = [];
  alvoX.forEach((x, i) => {
    const y = val(x);
    if (!M.ehDecimalExato(y)) return;
    const txt = `x = ${String(x).replace("-", "−")}:  y = ${substituir(rhs, fmtNum(x))} = ${M.formatar(y)}`;
    linhasTab.push({ t: txt, tam: 30, cor: undefined });
    contas.push(`${substituir(rhs, fmtNum(x))} = ${M.formatar(y)}`);
    const pid = `${id}_p${i}`;
    formas.push({ tipo: "circulo", x: X(x), y: Y(M.paraNumero(y)), raio: 7, estilo: "celula", oculta: true, id: pid });
    idsPontos.push(pid);
  });
  if (!idsPontos.length) throw new Error("Não consegui montar a tabela de valores (resultados não exatos).");

  // raízes (onde y = 0): a da reta (exata) ou as inteiras da curva
  const raizes = [];
  if (linear) { if (!M.ehZero(linear.a)) { const r = M.neg(M.dividido(linear.b, linear.a)); if (M.comparar(r, M.F(BigInt(xmin))) >= 0 && M.comparar(r, M.F(BigInt(xmax))) <= 0) raizes.push(r); } }
  else ys.forEach((y, k) => { if (M.ehZero(y)) raizes.push(M.F(BigInt(inteiros[k]))); });
  const passos = [];
  passos.push({
    figura: { id, origem: [Math.round(ox), Math.round(oy)], escala: 1, formas },
    linhas: lin([{ t: "Função", tam: 32, cor: "dim" }, { t: `y = ${bonita(rhs)}`, tam: 60, cor: "yellow", depois: 10 }, { t: "Para cada x, achamos um y.", tam: 32, neg: false, cor: "dim" }]),
    legenda: bl.legenda || `A função *y = ${bonita(rhs)}* liga cada valor de x a um valor de y.`,
  });
  passos.push({
    acoes: mostrarTodas(idsPontos),
    tiraLinhas: true,
    linhas: lin([{ t: "Tabela de valores", tam: 32, cor: "dim", depois: 4 }, ...linhasTab.map((l) => ({ ...l, neg: false, cor: "chalk" }))], 235),
    legenda: bl.legenda2 || "Trocamos o *x* por números e calculamos o *y* de cada um.",
  });
  const acoesCurva = [{ tipo: "tracar", alvo: idCurva, dur: 1.2 }];
  const itens3 = [{ t: linear ? "A função é uma *reta*." : "Ligando os pontos, aparece a *curva*.", tam: 38 }];
  let leg3 = bl.legenda3 || (linear ? "Ligando os pontos, aparece uma *reta*." : "Ligando os pontos, aparece uma *curva*.");
  if (raizes.length) {
    const nega = (t) => t.replace("-", "−");
    const txtRaizes = raizes.map((r) => nega(M.formatar(r))).join(" e ");
    itens3.push({ t: `Onde y = 0: x = ${txtRaizes}`, tam: 38, cor: "sky" });
    raizes.forEach((r, k) => {
      const rTxt = M.formatar(r).replace(/^−/, "-");
      const sub = substituir(rhs, rTxt);
      const yr = M.avaliar(rhs, { vars: { x: rTxt }, implicita: true });
      if (!M.ehZero(yr)) throw new Error("Erro interno: a raiz calculada não zera a função.");
      itens3.push({ t: `${sub} = 0`, tam: 34, cor: "sky" });
      contas.push(`${sub} = 0`);
      const rid = `${id}_raiz${k}`;
      formas.push({ tipo: "circulo", x: X(M.paraNumero(r)), y: Y(0), raio: 11, estilo: "tracoY", oculta: true, id: rid });
      acoesCurva.push({ tipo: "mostrar", alvo: rid, dur: 0.4 });
    });
    leg3 = bl.legenda3 || `A linha corta o eixo x em *x = ${txtRaizes}*, onde y vale zero.`;
  }
  passos.push({ acoes: acoesCurva, tiraLinhas: true, linhas: lin(itens3, 235), legenda: leg3 });
  return { passos, resumo: `y = ${bonita(rhs)}, x de ${xmin} a ${xmax}${raizes.length ? `, raízes x = ${raizes.map((r) => M.formatar(r)).join(" e ")}` : ""}`, contas, nome: "gráfico" };
}

/* ------------------------------------------------------------------ */
/* MOVIMENTO UNIFORME (Física)                                         */
/* ------------------------------------------------------------------ */
const CARRO_LARGURA = 104, PISTA = 620;
export function movimentoCena(bl, id) {
  const uv = (bl.unidadeVelocidade || "m/s").replace(/\s/g, "");
  const [uS, uT] = uv.split("/");
  if (!uS || !uT) throw new Error('A unidade da velocidade precisa ter o formato "m/s" ou "km/h".');
  const dados = { v: bl.velocidade, t: bl.tempo, S: bl.deslocamento };
  const dadas = Object.keys(dados).filter((k) => dados[k]);
  if (dadas.length !== 2) throw new Error("Informe exatamente duas das três grandezas: velocidade, tempo e deslocamento.");
  for (const k of dadas) { const n = M.lerNumero(dados[k]); if (n.n <= 0n) throw new Error(`A grandeza "${k}" precisa ser maior que zero.`); }
  let formula, valores;
  if (!dados.v) { formula = "v = S / t"; valores = { S: dados.S, t: dados.t }; }
  else if (!dados.t) { formula = "t = S / v"; valores = { S: dados.S, v: dados.v }; }
  else { formula = "S = v × t"; valores = { v: dados.v, t: dados.t }; }
  const un = { S: uS, t: uT, v: uv };
  const calc = M.calcularFormula(formula, valores, un);
  if (calc.resultado.n <= 0n) throw new Error("O resultado do movimento não pode ser zero nem negativo.");
  const V = dados.v ? M.lerNumero(dados.v) : calc.resultado, Tt = dados.t ? M.lerNumero(dados.t) : calc.resultado, Sd = dados.S ? M.lerNumero(dados.S) : calc.resultado;
  const Vt = M.formatar(V), Tx = M.formatar(Tt), Sx = M.formatar(Sd);
  const conta = `${calc.substituido} = ${M.formatar(calc.resultado)}`;
  const pos = (s) => Math.round(CARRO_LARGURA + (M.paraNumero(s) / M.paraNumero(Sd)) * (PISTA - CARRO_LARGURA));
  const dist = PISTA - CARRO_LARGURA;

  const R = 108;
  const formas = [
    { tipo: "linha", x1: 0, y1: R, x2: PISTA + 20, y2: R, estilo: "traco" },
    { tipo: "linha", x1: CARRO_LARGURA, y1: R - 6, x2: CARRO_LARGURA, y2: R + 24, estilo: "traco" },
    { tipo: "linha", x1: PISTA, y1: R - 6, x2: PISTA, y2: R + 24, estilo: "traco" },
    { tipo: "texto", x: CARRO_LARGURA, y: R + 62, t: `0 ${uS}`, tam: 28, cor: "dim" },
    { tipo: "poli", pontos: [[0, 86], [0, 64], [14, 58], [30, 36], [74, 36], [90, 58], [104, 62], [104, 86]], estilo: "celula", id: id + "_carro" },
    { tipo: "circulo", x: 24, y: 94, raio: 14, estilo: "area", id: id + "_r1" },
    { tipo: "circulo", x: 80, y: 94, raio: 14, estilo: "area", id: id + "_r2" },
    { tipo: "texto", x: PISTA, y: R + 62, t: `${Sx} ${uS}`, tam: 28, cor: "yellow", oculta: true, id: id + "_fim" },
  ];
  // marcas de tempo (se o tempo for inteiro pequeno)
  const tempoInt = M.ehInteiro(Tt) && Tt.n <= 5n ? Number(Tt.n) : 0;
  const tabela = [], contas = [conta];
  if (tempoInt) {
    for (let i = 1; i <= tempoInt; i++) {
      const s = M.vezes(V, M.F(BigInt(i)));
      const linha = `t = ${i} ${uT}:  S = ${Vt} × ${i} = ${M.formatar(s)} ${uS}`;
      tabela.push({ t: linha, tam: 32, neg: false });
      contas.push(`${Vt} × ${i} = ${M.formatar(s)}`);
      const xm = pos(s);
      formas.push({ tipo: "linha", x1: xm, y1: R - 6, x2: xm, y2: R + 12, estilo: "tracejado" });
    }
  }
  const passos = [];
  const nomeAlvo = { S: "deslocamento S", v: "velocidade v", t: "tempo t" };
  const linhasDados = [];
  linhasDados.push({ t: dados.v ? `velocidade v = ${Vt} ${uv}` : "velocidade v = ?", tam: 40, cor: dados.v ? undefined : "yellow" });
  linhasDados.push({ t: dados.t ? `tempo t = ${Tx} ${uT}` : "tempo t = ?", tam: 40, cor: dados.t ? undefined : "yellow" });
  linhasDados.push({ t: dados.S ? `deslocamento S = ${Sx} ${uS}` : "deslocamento S = ?", tam: 40, cor: dados.S ? undefined : "yellow" });
  passos.push({
    figura: { id, origem: [130, 300], escala: 1, formas },
    linhas: lin([{ t: "Movimento uniforme", tam: 32, cor: "dim", depois: 6 }, ...linhasDados], 235),
    legenda: bl.legenda || "O carro anda sempre com a *mesma velocidade*.",
  });
  passos.push({
    tiraLinhas: true,
    linhas: lin([
      { t: calc.formula.replace(/\//g, "÷"), tam: 60, cor: undefined, depois: 10 },
      { t: conta.replace(/ = [^=]*$/, ""), tam: 44, neg: false },
      { t: `${calc.alvo} = *${calc.resultadoTxt} ${un[calc.alvo]}*`, tam: 60 },
    ], 235),
    acoes: [{ tipo: "mostrar", alvo: id + "_fim", dur: 0.4 }],
    legenda: bl.legenda2 || `Trocamos as letras pelos números: *${nomeAlvo[calc.alvo]} = ${calc.resultadoTxt} ${un[calc.alvo]}*.`,
  });
  passos.push({
    acoes: [{ tipo: "mover", alvo: id + "_carro", x: dist, dur: 2.4 }, { tipo: "mover", alvo: id + "_r1", x: dist, dur: 2.4, junto: true }, { tipo: "mover", alvo: id + "_r2", x: dist, dur: 2.4, junto: true }],
    tiraLinhas: !!tabela.length,
    linhas: tabela.length ? lin([{ t: "A cada tempo, a distância cresce igual", tam: 32, neg: false, cor: "dim", depois: 8 }, ...tabela], 235) : null,
    legenda: bl.legenda3 || (tabela.length ? "Em tempos iguais, o carro percorre *distâncias iguais*." : "O carro percorre a distância na velocidade constante."),
  });
  return { passos, resumo: `${conta} ${un[calc.alvo]}`, contas, nome: "movimento" };
}
