// Matemática exata para as aulas animadas (sem ponto flutuante).
// Tudo aqui é calculado pelo Chronos, nunca pela IA: frações com BigInt,
// leitura de expressões escritas em português (vírgula decimal, espaço de milhar,
// ×, ÷, −, ², %, "20% de 150"), conta de equação do 1º grau e conferência de
// contas escritas em qualquer texto ("40 000 ÷ 100 = 400").
// Sem dependências: roda no navegador e no servidor.

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };

// Fração normalizada {n, d} (d > 0).
export function F(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new Error("Divisão por zero");
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
export const ZERO = F(0);
export const UM = F(1);
export const soma = (x, y) => F(x.n * y.d + y.n * x.d, x.d * y.d);
export const menos = (x, y) => F(x.n * y.d - y.n * x.d, x.d * y.d);
export const vezes = (x, y) => F(x.n * y.n, x.d * y.d);
export const dividido = (x, y) => { if (y.n === 0n) throw new Error("Divisão por zero"); return F(x.n * y.d, x.d * y.n); };
export const neg = (x) => F(-x.n, x.d);
export const igual = (x, y) => x.n === y.n && x.d === y.d;
export const ehZero = (x) => x.n === 0n;
export const ehInteiro = (x) => x.d === 1n;
export const comparar = (x, y) => { const a = x.n * y.d, b = y.n * x.d; return a < b ? -1 : a > b ? 1 : 0; };
export const paraNumero = (x) => Number(x.n) / Number(x.d);
export function potencia(x, k) {
  if (!Number.isInteger(k) || Math.abs(k) > 30) throw new Error("Expoente não suportado");
  if (k === 0) return UM;
  const b = k > 0 ? x : dividido(UM, x);
  let r = UM;
  for (let i = 0; i < Math.abs(k); i++) r = vezes(r, b);
  return r;
}

/* ---------------- números escritos em português ---------------- */
// "1 234,5" | "1.234,5" | "0,5" | "0.5" | "12" -> fração
export function lerNumero(txt) {
  const t = String(txt).trim().replace(/ /g, " ");
  let s;
  if (/^-?\d{1,3}(?:[ .]\d{3})+(?:,\d+)?$/.test(t)) s = t.replace(/[ .]/g, "").replace(",", ".");
  else if (/^-?\d+(?:[,.]\d+)?$/.test(t)) s = t.replace(",", ".");
  else throw new Error("Número inválido: " + txt);
  const neg1 = s.startsWith("-");
  if (neg1) s = s.slice(1);
  const [ip, fp = ""] = s.split(".");
  const r = F(BigInt(ip + fp), 10n ** BigInt(fp.length));
  return neg1 ? neg(r) : r;
}

// Decimal exato? (denominador só com fatores 2 e 5)
function casasDecimais(x) {
  let d = x.d, dois = 0, cinco = 0;
  while (d % 2n === 0n) { d /= 2n; dois++; }
  while (d % 5n === 0n) { d /= 5n; cinco++; }
  return d === 1n ? Math.max(dois, cinco) : -1;
}
function agrupar(ip) { return ip.replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

// Formata para mostrar ao aluno. milhar: agrupa de 3 em 3 a partir de 1 000.
export function formatar(x, { milhar = true } = {}) {
  const k = casasDecimais(x);
  if (k < 0) return x.n + "/" + x.d;
  const negativo = x.n < 0n;
  const abs = negativo ? -x.n : x.n;
  const escala = 10n ** BigInt(k);
  const inteiroEscalado = abs * escala / x.d;
  let s = inteiroEscalado.toString();
  while (s.length <= k) s = "0" + s;
  let ip = k > 0 ? s.slice(0, s.length - k) : s;
  const fp = k > 0 ? s.slice(s.length - k) : "";
  if (milhar && ip.length >= 4) ip = agrupar(ip);
  return (negativo ? "−" : "") + ip + (fp ? "," + fp : "");
}
// Aproximação com 'casas' casas decimais (arredondada), só para frações que não são decimais exatas.
export function aproximar(x, casas = 3) {
  const escala = 10n ** BigInt(casas);
  const negativo = x.n < 0n;
  const abs = negativo ? -x.n : x.n;
  let q = (abs * escala * 2n + x.d) / (x.d * 2n); // arredonda para o mais próximo
  let s = q.toString();
  while (s.length <= casas) s = "0" + s;
  const ip = s.slice(0, s.length - casas), fp = s.slice(s.length - casas).replace(/0+$/, "");
  return (negativo ? "−" : "") + agrupar(ip) + (fp ? "," + fp : "");
}
export const ehDecimalExato = (x) => casasDecimais(x) >= 0;
// texto pronto: exato, ou "n/d ≈ 0,333"
export function formatarComAprox(x) {
  return ehDecimalExato(x) ? formatar(x) : `${formatar(x)} ≈ ${aproximar(x)}`;
}

/* ---------------- expressões ---------------- */
// Valor "linear": a·x + b (a = 0 para números comuns). Só existe um x por conta.
const lin = (a, b) => ({ a, b });
const cte = (b) => lin(ZERO, b);
const somaL = (p, q) => lin(soma(p.a, q.a), soma(p.b, q.b));
const menosL = (p, q) => lin(menos(p.a, q.a), menos(p.b, q.b));
const negL = (p) => lin(neg(p.a), neg(p.b));
function vezesL(p, q) {
  if (ehZero(p.a)) return lin(vezes(q.a, p.b), vezes(q.b, p.b));
  if (ehZero(q.a)) return lin(vezes(p.a, q.b), vezes(p.b, q.b));
  throw new Error("A conta não é linear (x vezes x)");
}
function divididoL(p, q) {
  if (!ehZero(q.a)) throw new Error("Não dá para dividir por x aqui");
  return lin(dividido(p.a, q.b), dividido(p.b, q.b));
}

const SUP = { "²": "^2", "³": "^3", "⁴": "^4" };
function normalizar(bruto) {
  let s = String(bruto).replace(/ /g, " ");
  s = s.replace(/[²³⁴]/g, (c) => SUP[c]);
  s = s.replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/");
  s = s.replace(/(\d|\)|%)\s*[xX]\s*(?=\d|\()/g, "$1*");
  s = s.replace(/%\s*de\s+/gi, "% * ");
  return s;
}

function tokenizar(s, { implicita }) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/\d/.test(c)) {
      const rest = s.slice(i);
      let m = /^\d{1,3}(?: \d{3})+(?:,\d+)?(?![\d])/.exec(rest);
      if (!m) m = /^\d+(?:,\d+|\.\d+)?/.exec(rest);
      out.push({ t: "n", v: lerNumero(m[0]) });
      i += m[0].length;
      continue;
    }
    if ("+-*/^()%".includes(c)) { out.push({ t: c }); i++; continue; }
    const m = /^[\p{L}][\p{L}\d_]*/u.exec(s.slice(i));
    if (m) { out.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
    throw new Error("Símbolo não reconhecido: " + c);
  }
  return out;
}

// Avalia uma expressão. vars: {nome: "8"} (números escritos) ; incognita: nome do x.
export function avaliarLinear(bruto, { vars = {}, incognita = null, implicita = false } = {}) {
  const tk = tokenizar(normalizar(bruto), { implicita });
  let p = 0;
  const olha = () => tk[p];
  const come = (t) => { if (!tk[p] || tk[p].t !== t) throw new Error("Expressão incompleta"); return tk[p++]; };
  function primario() {
    const k = olha();
    if (!k) throw new Error("Expressão incompleta");
    if (k.t === "n") { p++; return cte(k.v); }
    if (k.t === "id") {
      p++;
      if (k.v === "π" || k.v === "pi") return cte(vars.pi != null ? lerNumero(vars.pi) : lerNumero("3,14"));
      if (incognita && k.v === incognita) return lin(UM, ZERO);
      if (Object.prototype.hasOwnProperty.call(vars, k.v)) return cte(typeof vars[k.v] === "string" ? lerNumero(vars[k.v]) : vars[k.v]);
      throw new Error("Variável sem valor: " + k.v);
    }
    if (k.t === "(") { p++; const v = soma_(); come(")"); return v; }
    throw new Error("Expressão inválida");
  }
  function pos() { // primário com ^ e %
    let b = primario();
    while (olha() && (olha().t === "^" || olha().t === "%")) {
      if (olha().t === "%") { p++; b = lin(dividido(b.a, F(100)), dividido(b.b, F(100))); continue; }
      p++;
      let sinal = 1;
      if (olha() && olha().t === "-") { sinal = -1; p++; }
      const e = olha();
      let ev;
      if (e && e.t === "(") { p++; const v = soma_(); come(")"); ev = v; }
      else if (e && e.t === "n") { p++; ev = cte(e.v); }
      else throw new Error("Expoente inválido");
      if (!ehZero(ev.a) || !ehInteiro(ev.b)) throw new Error("Expoente precisa ser inteiro");
      const k = sinal * Number(ev.b.n);
      if (ehZero(b.a)) b = cte(potencia(b.b, k));
      else if (k === 1) { /* x^1 */ }
      else throw new Error("Potência de x não suportada");
    }
    return b;
  }
  function unario() {
    if (olha() && olha().t === "-") { p++; return negL(unario()); }
    if (olha() && olha().t === "+") { p++; return unario(); }
    return pos();
  }
  function termo() {
    let v = unario();
    for (;;) {
      const k = olha();
      if (k && k.t === "*") { p++; v = vezesL(v, unario()); }
      else if (k && k.t === "/") { p++; v = divididoL(v, unario()); }
      else if (implicita && k && (k.t === "id" || k.t === "(")) { v = vezesL(v, pos()); }
      else if (implicita && k && k.t === "n" && tk[p - 1] && tk[p - 1].t === ")") { v = vezesL(v, pos()); }
      else break;
    }
    return v;
  }
  function soma_() {
    let v = termo();
    for (;;) {
      const k = olha();
      if (k && k.t === "+") { p++; v = somaL(v, termo()); }
      else if (k && k.t === "-") { p++; v = menosL(v, termo()); }
      else break;
    }
    return v;
  }
  const r = soma_();
  if (p < tk.length) throw new Error("Sobrou texto na expressão");
  return r;
}
// Só números (sem x). Devolve fração.
export function avaliar(bruto, opcoes = {}) {
  const r = avaliarLinear(bruto, opcoes);
  if (!ehZero(r.a)) throw new Error("A expressão tem incógnita");
  return r.b;
}

/* ---------------- conferir contas escritas em texto ---------------- */
const PERMITIDO = /[\d ,.+\-*/^()%]/;
const CHECA_OPERADOR = /[+\-*/^%]/;

// Procura "conta = resultado" em qualquer frase e confere.
// Devolve {conferidas, erros:[{trecho, esperado, lido}]}. Só olha contas só com números
// (com unidade colada ou letras no meio, ignora em vez de arriscar um alarme falso).
export function conferirTexto(bruto) {
  const s = normalizar(String(bruto).replace(/\*/g, "")); // * = destaque no quadro
  const erros = [];
  let conferidas = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "=") continue;
    const ant = s[i - 1];
    if (ant && "≠≈<>≤≥!=".includes(ant)) continue;
    if (s[i + 1] === "=") continue;
    // lado esquerdo
    let j = i - 1;
    while (j >= 0 && PERMITIDO.test(s[j])) j--;
    const runE = s.slice(j + 1, i);
    let esq = null, esqTxt = "";
    for (let k = 0; k < runE.length; k++) {
      const ch = runE[k];
      if (!(/\d/.test(ch) || ch === "(")) continue;
      if (k > 0 && /[\d,.]/.test(runE[k - 1])) continue;
      const antes = k === 0 ? s[j] : runE[k - 1];
      if (antes && /\p{L}/u.test(antes)) continue;
      // o que vem antes do começo da conta não pode ser um operador (conta cortada, ex.: "m² × 3 = ...")
      let q = j + 1 + k - 1;
      while (q >= 0 && s[q] === " ") q--;
      if (q >= 0 && /[+\-*/^(%]/.test(s[q])) continue;
      const expr = runE.slice(k).trim();
      if (!CHECA_OPERADOR.test(expr)) continue;
      try { esq = avaliar(expr); esqTxt = expr; break; } catch { /* tenta um trecho menor */ }
    }
    if (!esq) continue;
    // lado direito
    let r0 = i + 1;
    while (s[r0] === " ") r0++;
    const moeda = /^R\$\s*/.exec(s.slice(r0));
    if (moeda) r0 += moeda[0].length;
    if (!/[\d(\-]/.test(s[r0] || "")) continue;
    let r1 = r0;
    while (r1 < s.length && PERMITIDO.test(s[r1])) r1++;
    const runD = s.slice(r0, r1);
    let dir = null, dirTxt = "", fim = r0;
    for (let e = runD.length; e > 0; e--) {
      if (!/[\d)%]/.test(runD[e - 1])) continue;
      const expr = runD.slice(0, e).trim();
      try { dir = avaliar(expr); dirTxt = expr; fim = r0 + e; break; } catch { /* tenta menor */ }
    }
    if (!dir) continue;
    const depois = s[fim];
    if (depois && /\p{L}/u.test(depois)) continue; // "5cm": não arrisca
    conferidas++;
    if (!igual(esq, dir)) {
      erros.push({ trecho: `${esqTxt.replace(/\*/g, "×").replace(/\//g, "÷")} = ${dirTxt}`, esperado: formatar(esq), lido: formatar(dir) });
    }
  }
  return { conferidas, erros };
}

/* ---------------- equação do 1º grau ---------------- */
function bonitaConta(t) {
  return String(t).replace(/\*/g, "×").replace(/(?<=\s)-(?=\s)/g, "−").replace(/\s+/g, " ").trim();
}
function coefTxt(a, letra) {
  if (igual(a, UM)) return letra;
  if (igual(a, neg(UM))) return "−" + letra;
  return formatar(a) + " " + letra;
}
// Resolve "2x + 3 = 11" e devolve os passos (todos calculados aqui).
export function resolverEquacao(bruto) {
  const partes = String(bruto).split("=");
  if (partes.length !== 2) throw new Error("A equação precisa ter um único sinal de =");
  const letras = [...new Set((String(bruto).match(/\p{L}/gu) || []))].filter((l) => l !== "x" || true);
  if (letras.length !== 1) throw new Error("Use uma só letra como incógnita");
  const x = letras[0];
  const L = avaliarLinear(partes[0], { incognita: x, implicita: true });
  const R = avaliarLinear(partes[1], { incognita: x, implicita: true });
  const A = menos(L.a, R.a);
  if (ehZero(A)) throw new Error("Esta equação não tem uma única solução");
  const B = menos(R.b, L.b);
  const sol = dividido(B, A);
  const passos = [];
  passos.push({ texto: bonitaConta(bruto), nota: "A equação" });
  // passar termos: x para a esquerda, números para a direita
  const temX_dir = !ehZero(R.a), temCte_esq = !ehZero(L.b);
  if (temX_dir || temCte_esq) {
    const esq = temX_dir ? `${coefTxt(L.a, x)} ${ehZero(L.a) ? "" : ""}`.trim() : coefTxt(L.a, x);
    let esqTexto = coefTxt(L.a, x);
    if (temX_dir) esqTexto += ` ${R.a.n < 0n ? "+" : "−"} ${coefTxt(R.a.n < 0n ? neg(R.a) : R.a, x)}`;
    let dirTexto = formatar(R.b);
    if (temCte_esq) dirTexto += ` ${L.b.n < 0n ? "+" : "−"} ${formatar(L.b.n < 0n ? neg(L.b) : L.b)}`;
    void esq;
    passos.push({ texto: `${esqTexto} = ${dirTexto}`, nota: "Passamos os números para um lado e os x para o outro (a operação inverte)" });
    passos.push({ texto: `${coefTxt(A, x)} = ${formatar(B)}`, nota: "Fazemos as contas de cada lado" });
  }
  if (!igual(A, UM)) {
    passos.push({ texto: `${x} = ${formatar(B)} ÷ ${A.n < 0n ? "(" + formatar(A) + ")" : formatar(A)}`, nota: `O ${formatar(A)} está multiplicando o ${x}: passa dividindo` });
  }
  passos.push({ texto: `${x} = *${formatarComAprox(sol)}*`, nota: "Resultado", resultado: true });
  // conferência: coloca o valor no lugar do x
  const sub = (t) => bonitaConta(String(t).replace(new RegExp(`(\\d)\\s*${x}`, "gu"), "$1 × " + x).replace(new RegExp(x, "gu"), sol.n < 0n ? `(${formatar(sol)})` : formatar(sol)));
  const vEsq = avaliarLinear(partes[0], { incognita: x, implicita: true });
  const vDir = avaliarLinear(partes[1], { incognita: x, implicita: true });
  const valEsq = soma(vezes(vEsq.a, sol), vEsq.b), valDir = soma(vezes(vDir.a, sol), vDir.b);
  const ok = igual(valEsq, valDir);
  passos.push({ texto: `Conferindo: ${sub(partes[0])} = ${formatar(valEsq)}   e   ${sub(partes[1])} = ${formatar(valDir)} ${ok ? "✓" : "✗"}`, nota: "Conferência", conferencia: true, ok });
  return { variavel: x, solucao: sol, passos, ok };
}

// Substitui as variáveis numa fórmula "A = b × h" e calcula. Devolve os textos.
export function calcularFormula(formula, valores, unidades = {}) {
  const partes = String(formula).split("=");
  if (partes.length !== 2) throw new Error("A fórmula precisa ter um único =");
  const alvo = partes[0].trim();
  const rhs = partes[1].trim();
  const vars = { ...valores };
  const resultado = avaliar(rhs, { vars, implicita: true });
  const trocado = normalizar(rhs).replace(/\p{L}[\p{L}\d_]*/gu, (nome) => {
    if (nome === "π" || nome === "pi") return vars.pi != null ? String(vars.pi) : "3,14";
    if (!Object.prototype.hasOwnProperty.call(vars, nome)) return nome;
    const v = String(vars[nome]);
    return v.startsWith("-") ? `(${v})` : v;
  });
  const usaPi = /π|\bpi\b/.test(rhs);
  const un = unidades[alvo] || "";
  return {
    alvo,
    formula: bonitaConta(String(formula)),
    substituido: `${alvo} = ${bonitaConta(trocado).replace(/\*/g, "×").replace(/\//g, "÷")}`,
    resultado,
    resultadoTxt: formatarComAprox(resultado),
    unidade: un,
    usaPi,
    pi: vars.pi != null ? String(vars.pi) : "3,14",
  };
}
