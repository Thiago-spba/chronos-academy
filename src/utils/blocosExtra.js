// Blocos da Etapa 4: fração, gráfico de função e movimento (Física).
// Funções PURAS: recebem o bloco do plano e devolvem uma "cena" (formas, textos, passos).
// Toda conta é feita aqui com aritmética exata (matematicaExata.js); a IA nunca calcula.
// O compilador (compiladorAula.js) só transforma a cena em passos do motor.
import * as M from "./matematicaExata.js";

const mdc = (a, b) => (b === 0 ? a : mdc(b, a % b));
const mmc = (a, b) => (a / mdc(a, b)) * b;

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
  const m = /^\s*\(?\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*\)?\s*$/.exec(String(txt || ""));
  if (!m) throw new Error(`A fração "${nome}" precisa estar no formato 3/4.`);
  const n = Number(m[1]), d = Number(m[2]);
  if (d < 2 || d > 24) throw new Error(`O denominador de "${txt}" precisa ficar entre 2 e 24.`);
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
    const itens = [{ t: `${a.n} ${a.n === 1 ? "parte pintada" : "partes pintadas"}`, tam: 44 }, { t: `Fração: ${T(a.n, a.d)}`, tam: 56, cor: "yellow" }];
    if (a.d > 1 && M.ehDecimalExato(v)) { itens.push({ t: `${T(a.n, a.d)} = ${M.formatar(v)}`, tam: 42, cor: "sky" }); contas.push(`${T(a.n, a.d)} = ${M.formatar(v)}`); }
    passos.push({ acoes: mostrarTodas(pintadas[0]), tiraLinhas: true, linhas: lin(itens), legenda: bl.legenda2 || `Pintamos *${a.n}* ${a.n === 1 ? "parte das" : "das"} *${a.d}* partes: é a fração *${T(a.n, a.d)}*.` });
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
/* GRÁFICO DE FUNÇÃO (1º ou 2º grau, lida como polinômio exato)        */
/* ------------------------------------------------------------------ */
function passoNice(span) {
  for (const p of [1, 2, 5, 10, 20, 50, 100, 200, 500]) if (span / p <= 8) return p;
  return 1000;
}
const menosTxt = (t) => String(t).replace(/^-/, "−");

export function graficoCena(bl, id) {
  const m = /^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)$/i.exec(String(bl.funcao || ""));
  if (!m) throw new Error('A função precisa estar no formato "y = 2x + 1".');
  const rhs = m[1].trim();
  let c;
  try { c = M.polinomio(rhs, "x"); } catch (e) { throw new Error(`Não consegui ler a função "${rhs}" (${e.message}).`); }
  const grau = c.length - 1;
  if (grau > 2) throw new Error("O gráfico aceita funções do 1º ou do 2º grau (ex.: y = 2x + 1 ou y = x² − 4).");
  if (grau === 0 && M.ehZero(c[0])) throw new Error("A função é sempre zero; escolha outra.");
  const f = (x) => M.valorPolinomio(c, x);
  const fN = (x) => M.paraNumero(f(M.lerNumero(String(x).replace(".", ",")))) ;
  // raízes exatas (ou aproximadas, quando irracionais)
  let raizes = [], raizesAprox = [], tipoRaiz = "nenhuma", toca = false;
  if (grau === 1) { raizes = [M.neg(M.dividido(c[0], c[1]))]; tipoRaiz = "exata"; }
  else if (grau === 2) {
    const D = M.menos(M.vezes(c[1], c[1]), M.vezes(M.F(4n), M.vezes(c[2], c[0])));
    if (D.n === 0n) { raizes = [M.dividido(M.neg(c[1]), M.vezes(M.F(2n), c[2]))]; tipoRaiz = "exata"; toca = true; }
    else if (D.n > 0n) {
      const r = M.raizExata(D);
      const den = M.vezes(M.F(2n), c[2]);
      if (r) { raizes = [M.dividido(M.menos(M.neg(c[1]), r), den), M.dividido(M.soma(M.neg(c[1]), r), den)]; tipoRaiz = "exata"; }
      else {
        const sq = Math.sqrt(M.paraNumero(D)), b = M.paraNumero(c[1]), a2 = M.paraNumero(den);
        raizesAprox = [(-b - sq) / a2, (-b + sq) / a2];
        tipoRaiz = "aprox";
      }
      raizes.sort((u, v) => M.comparar(u, v)); raizesAprox.sort((u, v) => u - v);
    }
  }
  const rNum = tipoRaiz === "exata" ? raizes.map((r) => M.paraNumero(r)) : raizesAprox;
  // intervalo de x: inclui o 0 e as raízes
  let xmin = bl.xmin != null ? bl.xmin : -3, xmax = bl.xmax != null ? bl.xmax : 3;
  xmin = Math.min(xmin, 0); xmax = Math.max(xmax, 0);
  rNum.forEach((r) => { if (r < xmin) xmin = Math.floor(r) - 1; if (r > xmax) xmax = Math.ceil(r) + 1; });
  if (xmax - xmin < 2) { xmin = Math.min(xmin, -3); xmax = Math.max(xmax, 3); }
  if (xmax - xmin > 12) throw new Error("O gráfico precisaria de mais de 12 unidades no eixo x; escolha outra função ou outro intervalo.");
  const inteiros = [];
  for (let x = xmin; x <= xmax; x++) inteiros.push(x);
  const ys = inteiros.map((x) => f(M.F(BigInt(x))));
  const yf = ys.map((y) => M.paraNumero(y));
  if (yf.some((y) => Math.abs(y) > 1000)) throw new Error("Os valores de y ficaram grandes demais (máximo 1000); escolha outro intervalo de x.");
  // curva
  const pontosCurva = [];
  if (grau <= 1) pontosCurva.push([xmin, fN(xmin)], [xmax, fN(xmax)]);
  else for (let i = 0; i <= (xmax - xmin) * 10; i++) { const x = xmin + i / 10; pontosCurva.push([x, M.paraNumero(f(M.dividido(M.F(BigInt(Math.round(x * 10))), M.F(10n))))]); }
  let ymin = Math.min(0, ...yf, ...pontosCurva.map((p) => p[1])), ymax = Math.max(0, ...yf, ...pontosCurva.map((p) => p[1]));
  if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; }
  const yt = Math.floor(ymin - 1e-9), ya = Math.ceil(ymax + 1e-9);
  const Sx = Math.min(80, 620 / (xmax - xmin)), Sy = Math.min(70, 340 / (ya - yt));
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
  for (const x of inteiros) if (x !== 0 && x % passoX === 0) formas.push({ tipo: "texto", x: X(x), y: Y(0) + 30, t: menosTxt(x), tam: 22, cor: "dim" });
  for (let y = Math.ceil(yt / py) * py; y <= ya; y += py) if (y !== 0) formas.push({ tipo: "texto", x: X(0) - 22, y: Y(y) + 8, t: menosTxt(y), tam: 22, cor: "dim", ancora: "fim" });
  const idCurva = id + "_curva";
  formas.push({ tipo: "curva", pontos: pontosCurva.map(([x, y]) => [X(x), Y(y)]), estilo: "tracoY", id: idCurva, tracar: true });

  // tabela: até 7 valores de x, simétricos quando possível, sempre com o 0
  let alvoX = inteiros;
  if (inteiros.length > 7) {
    const set = new Set([xmin, xmax, 0]);
    for (let k = 1; set.size < 7 && k < 7; k++) { set.add(Math.trunc(xmin * k / 3)); set.add(Math.trunc(xmax * k / 3)); }
    alvoX = [...set].filter((v) => v >= xmin && v <= xmax).sort((a, b) => a - b).slice(0, 7);
  }
  const linhasTab = [], idsPontos = [], contas = [];
  alvoX.forEach((x, i) => {
    const xv = M.F(BigInt(x)), y = f(xv);
    const conta = M.escreverConta(rhs, { x: xv });
    if (!M.igual(M.avaliar(conta), y)) throw new Error("Erro interno: a conta da tabela não confere.");
    const yTxt = M.formatarComAprox(y);
    linhasTab.push({ t: `x = ${menosTxt(x)}:  y = ${conta} = ${yTxt}`, tam: 30 });
    contas.push(`${conta} = ${yTxt}`);
    const pid = `${id}_p${i}`;
    formas.push({ tipo: "circulo", x: X(x), y: Y(M.paraNumero(y)), raio: 7, estilo: "celula", oculta: true, id: pid });
    idsPontos.push(pid);
  });
  const fTxt = M.escreverConta(rhs, {}, { compacto: true });
  const passos = [];
  passos.push({
    figura: { id, origem: [Math.round(ox), Math.round(oy)], escala: 1, formas },
    linhas: lin([{ t: "Função", tam: 32, cor: "dim" }, { t: `y = ${fTxt}`, tam: 60, cor: "yellow", depois: 10 }, { t: "Para cada x, achamos um y.", tam: 32, neg: false, cor: "dim" }]),
    legenda: bl.legenda || `A função *y = ${fTxt}* liga cada valor de x a um valor de y.`,
  });
  passos.push({
    acoes: mostrarTodas(idsPontos),
    tiraLinhas: true,
    linhas: lin([{ t: "Tabela de valores", tam: 32, cor: "dim", depois: 4 }, ...linhasTab.map((l) => ({ ...l, neg: false, cor: "chalk" }))], 235),
    legenda: bl.legenda2 || "Trocamos o *x* por números e calculamos o *y* de cada um.",
  });
  const acoesCurva = [{ tipo: "tracar", alvo: idCurva, dur: 1.2 }];
  const nomeLinha = grau === 2 ? "parábola" : "reta";
  const itens3 = [{ t: grau === 0 ? "A função é constante: uma *reta* horizontal." : grau === 1 ? "A função é do 1º grau: uma *reta*." : "A função é do 2º grau: a curva é uma *parábola*.", tam: 36 }];
  let leg3 = bl.legenda3;
  const marca = (xr, k) => { const rid = `${id}_raiz${k}`; formas.push({ tipo: "circulo", x: X(xr), y: Y(0), raio: 11, estilo: "tracoY", oculta: true, id: rid }); acoesCurva.push({ tipo: "mostrar", alvo: rid, dur: 0.4 }); };
  if (tipoRaiz === "exata") {
    const txts = raizes.map((r) => menosTxt(M.formatarComAprox(r)));
    const verbo = toca ? "toca" : "corta";
    itens3.push({ t: `Onde y = 0: x = ${txts.join(" e x = ")}`, tam: 36, cor: "sky" });
    raizes.forEach((r, k) => {
      const conta = M.escreverConta(rhs, { x: r });
      if (!M.ehZero(M.avaliar(conta))) throw new Error("Erro interno: a raiz calculada não zera a função.");
      itens3.push({ t: `${conta} = 0`, tam: 32, cor: "sky" });
      contas.push(`${conta} = 0`);
      marca(M.paraNumero(r), k);
    });
    leg3 = leg3 || `A ${nomeLinha} ${verbo} o eixo x em *x = ${txts.join(" e x = ")}*: ali y vale zero.`;
  } else if (tipoRaiz === "aprox") {
    const txts = raizesAprox.map((r) => menosTxt(M.aproximar(M.dividido(M.F(BigInt(Math.round(r * 1e9))), M.F(1000000000n)), 2)));
    itens3.push({ t: `Onde y = 0: x ≈ ${txts.join(" e x ≈ ")}`, tam: 36, cor: "sky" }, { t: "(raízes não exatas, arredondadas)", tam: 28, neg: false, cor: "dim" });
    raizesAprox.forEach((r, k) => marca(r, k));
    leg3 = leg3 || `A parábola corta o eixo x perto de *x ≈ ${txts.join(" e x ≈ ")}*.`;
  } else {
    itens3.push({ t: grau === 2 ? "Não corta o eixo x: y nunca vale 0." : "Não corta o eixo x: y nunca vale 0.", tam: 32, cor: "sky" });
    leg3 = leg3 || (grau === 2 ? "Esta parábola *não corta* o eixo x: não existe x com y = 0." : "A reta é horizontal e *não corta* o eixo x.");
  }
  passos.push({ acoes: acoesCurva, tiraLinhas: true, linhas: lin(itens3, 235), legenda: leg3 });
  const resumoR = tipoRaiz === "exata" ? `, raízes x = ${raizes.map((r) => M.formatarComAprox(r)).join(" e ")}` : tipoRaiz === "aprox" ? ", raízes não exatas" : ", sem raiz real";
  return { passos, resumo: `y = ${fTxt} (${grau}º grau), x de ${xmin} a ${xmax}${resumoR}`, contas, nome: "gráfico" };
}

/* ------------------------------------------------------------------ */
/* MOVIMENTO UNIFORME (Física)                                         */
/* ------------------------------------------------------------------ */
const CARRO_LARGURA = 104, PISTA = 620;
export function movimentoCena(bl, id) {
  const uv = (bl.unidadeVelocidade || "m/s").replace(/\s/g, "");
  const [uS, uT] = uv.split("/");
  if (!/^(mm|cm|m|km)$/.test(uS || "") || !/^(s|min|h)$/.test(uT || "")) throw new Error('A unidade da velocidade precisa ser distância/tempo, como "m/s" ou "km/h".');
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
