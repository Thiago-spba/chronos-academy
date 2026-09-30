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
  if (k < 0) return (x.n < 0n ? "−" + -x.n : String(x.n)) + "/" + x.d;
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
// Aproximação arredondada. Para números pequenos (|x| < 1) garante 3 algarismos significativos
// (1/3000 vira "0,000333", nunca "0"). Só para mostrar valores que não são exatos.
export function aproximar(x, casas = 3) {
  const negativo = x.n < 0n;
  const abs = negativo ? -x.n : x.n;
  if (abs !== 0n && abs < x.d) {
    let k = 0; // zeros depois da vírgula antes do 1º algarismo significativo
    while (abs * 10n ** BigInt(k + 1) < x.d) k++;
    casas = Math.max(casas, k + 3);
  }
  const escala = 10n ** BigInt(casas);
  let q = (abs * escala * 2n + x.d) / (x.d * 2n); // arredonda para o mais próximo
  let s = q.toString();
  while (s.length <= casas) s = "0" + s;
  const ip = s.slice(0, s.length - casas), fp = s.slice(s.length - casas).replace(/0+$/, "");
  return (negativo && q !== 0n ? "−" : "") + agrupar(ip) + (fp ? "," + fp : "");
}
export const ehDecimalExato = (x) => casasDecimais(x) >= 0;
// texto pronto: exato, ou "n/d ≈ 0,333"
export function formatarComAprox(x) {
  return ehDecimalExato(x) ? formatar(x) : `${formatar(x)} ≈ ${aproximar(x)}`;
}

/* ---------------- pontos em números ---------------- */
// "1.000.000" -> "1 000 000" ; "0.125" -> "0,125" ; "2.5" -> "2,5" ; "1.875" (um grupo de 3) é AMBÍGUO.
export function normalizarPontos(t) {
  let ambiguo = null;
  let s = String(t).replace(/(?<![\d.,])\d{1,3}(?:\.\d{3}){2,}(?![\d.,])/g, (m) => m.replace(/\./g, " "));
  s = s.replace(/(?<![\d.,])0\.(\d+)(?![\d.,])/g, "0,$1");
  s = s.replace(/(?<![\d.,])(\d+)\.(\d{1,2}|\d{4,})(?![\d.,])/g, "$1,$2");
  s = s.replace(/(?<![\d.,])([1-9]\d{0,2})\.(\d{3})(?![\d.,])/g, (m) => { ambiguo = ambiguo || m; return m; });
  s = s.replace(/(?<![\d])\.(\d)/g, (m) => { ambiguo = ambiguo || m; return m; });
  return { texto: s, ambiguo };
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

const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const PARA_SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export const sobrescrito = (n) => String(n).split("").map((c) => PARA_SUP[c] || c).join("");
function normalizar(bruto) {
  let s = String(bruto).replace(/ /g, " ");
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (c) => "^" + c.split("").map((d) => SUP[d]).join(""));
  s = s.replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/");
  s = s.replace(/(\d|\)|%)\s*[xX]\s*(?=\d)/g, "$1*").replace(/(\d|\)|%)\s+[xX]\s+(?=\()/g, "$1*");
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
    if (c === "π") { out.push({ t: "id", v: "π" }); i++; continue; } // "2πr" = 2 × π × r
    const m = /^[\p{L}][\p{L}\d_]*/u.exec(s.slice(i).replace(/π.*$/u, ""));
    if (m) { out.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
    throw new Error("Símbolo não reconhecido: " + c);
  }
  return out;
}

// Avalia uma expressão. vars: {nome: "8"} (números escritos) ; incognita: nome do x.
const usouPi = { valor: false };
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
      if (k.v === "π" || k.v === "pi") { usouPi.valor = true; return cte(vars.pi != null ? lerNumero(vars.pi) : lerNumero("3,14")); }
      if (incognita && k.v === incognita) return lin(UM, ZERO);
      if (Object.prototype.hasOwnProperty.call(vars, k.v)) return cte(typeof vars[k.v] === "string" ? lerNumero(vars[k.v]) : vars[k.v]);
      throw new Error("Variável sem valor: " + k.v);
    }
    if (k.t === "(") { p++; const v = soma_(); come(")"); return v; }
    throw new Error("Expressão inválida");
  }
  function pos() { // primário com ^ e %  (a ^ b ^ c = a ^ (b ^ c), como na matemática)
    let b = primario();
    for (;;) {
      if (olha() && olha().t === "%") { p++; b = lin(dividido(b.a, F(100)), dividido(b.b, F(100))); continue; }
      if (!(olha() && olha().t === "^")) break;
      p++;
      let sinal = 1;
      while (olha() && (olha().t === "-" || olha().t === "+")) { if (olha().t === "-") sinal = -sinal; p++; }
      const ev = pos(); // o expoente pode ter outra potência (associa pela direita)
      if (!ehZero(ev.a) || !ehInteiro(ev.b)) throw new Error("Expoente precisa ser um número inteiro");
      const k = sinal * Number(ev.b.n);
      if (ehZero(b.a)) {
        if (k === 0 && ehZero(b.b)) throw new Error("0 elevado a 0 não é definido");
        if (k < 0 && ehZero(b.b)) throw new Error("Divisão por zero");
        b = cte(potencia(b.b, k));
      } else if (k === 1) { /* x^1 */ }
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
// A conta usa π? (o valor com π ≈ 3,14 é APROXIMADO: mostrar com ≈)
export function usaPi(bruto) { return /π|(^|[^\p{L}])pi(?![\p{L}])/iu.test(String(bruto)); }
// Texto do resultado para o aluno: sinal "=" ou "≈" e o número.
// Com π: sempre "≈" (π ≈ 3,14), arredondado em 2 casas (ou 3 algarismos significativos).
// Sem π: "=" e o valor exato; dízima vira "1/3 ≈ 0,333".
export function mostrarResultado(x, { pi = false } = {}) {
  if (pi) return { sinal: "≈", texto: ehDecimalExato(x) && casasDecimais(x) <= 2 ? formatar(x) : aproximar(x, 2) };
  return { sinal: "=", texto: formatarComAprox(x) };
}
// Só números (sem x). Devolve fração.
export function avaliar(bruto, opcoes = {}) {
  const r = avaliarLinear(bruto, opcoes);
  if (!ehZero(r.a)) throw new Error("A expressão tem incógnita");
  return r.b;
}

/* ---------------- conferir contas escritas em texto ---------------- */
// Unidades conhecidas: fator para a unidade base da família (comprimento em m, massa em g,
// tempo em s, velocidade em m/s). Área e volume: comprimento elevado a 2 ou 3.
const UNI = {
  mm: ["c", F(1n, 1000n)], cm: ["c", F(1n, 100n)], dm: ["c", F(1n, 10n)], m: ["c", UM], dam: ["c", F(10n)], hm: ["c", F(100n)], km: ["c", F(1000n)],
  mg: ["massa", F(1n, 1000n)], g: ["massa", UM], kg: ["massa", F(1000n)],
  s: ["tempo", UM], min: ["tempo", F(60n)], h: ["tempo", F(3600n)],
  "km/h": ["vel", F(1000n, 3600n)], "m/s": ["vel", UM],
  L: ["c3", F(1n, 1000n)], mL: ["c3", F(1n, 1000000n)], ha: ["c2", F(10000n)],
};
export function infoUnidade(u) {
  const m = /^(km\/h|m\/s|mm|cm|dm|dam|hm|km|mg|kg|min|mL|ha|m|g|s|h|L)(?:\^?([23]))?$/.exec(String(u || "").replace(/²/g, "2").replace(/³/g, "3").trim());
  if (!m) return null;
  const [fam, fator] = UNI[m[1]];
  const e = m[2] ? Number(m[2]) : 1;
  if (fam === "c") return { familia: "c" + (e === 1 ? "" : e), base: m[1], exp: e, fator: potencia(fator, e) };
  if (e !== 1) return null;
  if (fam === "c3") return { familia: "c3", base: m[1], exp: 3, fator };
  if (fam === "c2") return { familia: "c2", base: m[1], exp: 2, fator };
  return { familia: fam, base: m[1], exp: 1, fator };
}
const RE_UNI = /^\s*(km\/h|m\/s|mm|cm|dm|dam|hm|km|mg|kg|min|mL|ha|m|g|s|h|L)(\^[23])?(?![\p{L}\d\/])/u;
const PI_FINO = "3,14159265358979323846";

// quebra o texto em pedaços matemáticos (números com unidade, operadores, relações) e "quebras"
function pedacosTexto(bruto) {
  let s0 = String(bruto).replace(/(\d)\s*\*\s*(?=[\d(])/g, "$1 × ").replace(/\*/g, "").replace(/R\$\s*/g, "").replace(/…/g, "...");
  s0 = s0.replace(/^\s*(?:[a-zA-Z]|\d{1,2})\)\s+/, ""); // rótulo de exercício: "a) 12 × 3 = 36"
  s0 = s0.replace(/(?<![\d,\/.]|\d )(\d+)\/(\d+)(?![\d,\/])/g, "($1/$2)"); // "1/2" escrito junto é uma fração
  let s = normalizar(s0);
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    const resto = s.slice(i);
    let m = /^\d{1,3}(?: \d{3})+(?:,\d+)?(?![\d,])|^\d+(?:,\d+)?/.exec(resto);
    if (m && !/^\d{1,3}(?: \d{3})+/.test(resto)) m = /^\d+(?:,\d+)?/.exec(resto);
    if (m) {
      const tk = { t: "n", txt: m[0], v: lerNumero(m[0]), ini: i };
      i += m[0].length;
      if (s.slice(i, i + 3) === "...") { tk.trunc = true; i += 3; }
      const u = RE_UNI.exec(s.slice(i));
      if (u) { const inf = infoUnidade(u[1] + (u[2] || "")); if (inf) { tk.u = inf; i += u[0].length; } }
      const rr = /^\s*[,;]?\s*(?:e\s+|com\s+)?resto\s*(?:=|é|de)?\s*(\d+)/.exec(s.slice(i));
      if (rr) { tk.resto = lerNumero(rr[1]); i += rr[0].length; }
      out.push(tk);
      continue;
    }
    if ("+-*/^()%".includes(c)) { out.push({ t: c, ini: i }); i++; continue; }
    if (c === "π") { out.push({ t: "pi", ini: i }); i++; continue; }
    if (c === "√") { out.push({ t: "raiz" }); i++; continue; }
    if ("=≈<>≤≥".includes(c)) {
      if (s[i + 1] === "=" && (c === "<" || c === ">")) { out.push({ t: "rel", v: c === "<" ? "≤" : "≥" }); i += 2; continue; }
      if (c === "=" && s[i + 1] === "=") { out.push({ t: "quebra" }); i += 2; continue; }
      out.push({ t: "rel", v: c }); i++; continue;
    }
    // letra, pontuação, ≠, etc.: interrompe (palavra "colada" no número anterior, como em "2x", marca a conta como incompleta)
    const w = /^[\p{L}\d_]+/u.exec(resto);
    out.push({ t: "quebra", palavra: !!w, colado: i > 0 && s[i - 1] !== " ", letra: !!w && /^\p{L}$/u.test(w[0]) && !/^[eéaàoó]$/i.test(w[0]), fim: i + (w ? w[0].length : 1) });
    i += w ? w[0].length : 1;
  }
  return out;
}

// avalia uma lista de pedaços (sem relações). Devolve {exato, fino, pi, irracional, temOp, unidades, soProduto} ou null
function avaliarPedacos(tks) {
  if (!tks.length) return null;
  const temOp = tks.some((k) => "+-*/^%".includes(k.t) || k.t === "raiz" || k.t === "pi") && !(tks.length === 2 && tks[0].t === "-" && tks[1].t === "n");
  let pi = false, irr = false;
  const monta = (modo) => {
    const partes = [];
    for (let j = 0; j < tks.length; j++) {
      const k = tks[j];
      if (k.t === "n") { if (partes.length && /[\d]$/.test(partes[partes.length - 1])) return null; if (partes.length && /\)$/.test(partes[partes.length - 1])) partes.push("*"); partes.push(k.txt); }
      else if (k.t === "(" && partes.length && /[\d)]$/.test(partes[partes.length - 1])) { partes.push("*"); partes.push("("); }
      else if (k.t === "pi") { pi = true; partes.push(modo === "fino" ? `(${PI_FINO})` : "(3,14)"); }
      else if (k.t === "raiz") {
        const a = tks[j + 1];
        if (!a || a.t !== "n") return null;
        const v = a.v;
        const rq = (b) => { let r = BigInt(Math.floor(Math.sqrt(Number(b)))); while (r * r > b) r--; while ((r + 1n) * (r + 1n) <= b) r++; return r * r === b ? r : null; };
        const rn = v.n >= 0n ? rq(v.n) : null, rd = rq(v.d);
        if (rn != null && rd != null) partes.push(`(${formatar(F(rn, rd), { milhar: false })})`);
        else { irr = true; partes.push(`(${String(Math.sqrt(paraNumero(v)).toFixed(12)).replace(".", ",")})`); }
        j++;
      } else partes.push(k.t);
    }
    return partes.join(" ");
  };
  try {
    const e1 = monta("exato"), e2 = monta("fino");
    if (e1 == null) return null;
    const exato = avaliar(e1), fino = avaliar(e2);
    // valor em unidades-base: cada número com unidade vira número × fator (2 h -> 2 × 3600 s)
    let si = null;
    const fams = new Set(tks.filter((k) => k.t === "n" && k.u).map((k) => k.u.familia.replace(/\d/g, "")));
    if (fams.size === 1) {
      const orig = tks.map((k) => k.txt);
      tks.forEach((k) => { if (k.t === "n" && k.u) k.txt = `(${k.txt} × ${formatar(k.u.fator, { milhar: false })})`; });
      try { const e3 = monta("exato"); si = e3 == null ? null : avaliar(e3); } catch { si = null; }
      tks.forEach((k, j) => { if (orig[j] != null) k.txt = orig[j]; });
      si = si ? { valor: si, familia: [...fams][0] } : null;
    }
    const comU = tks.filter((k) => k.t === "n" && k.u);
    const soProduto = tks.every((k) => k.t === "n" || k.t === "*" || k.t === "pi");
    return { exato, fino, si, pi, irracional: irr, temOp, unidades: comU.map((k) => k.u), soProduto, nums: tks.filter((k) => k.t === "n") };
  } catch { return null; }
}
const casasDoTexto = (txt) => (String(txt).split(",")[1] || "").length;
const absF = (x) => (x.n < 0n ? neg(x) : x);

// Procura contas escritas em qualquer frase ("A op B = C", "N m = M cm", "π × 5² ≈ 78,5", "3/4 > 2/3")
// e confere. Devolve {conferidas, erros:[{trecho, esperado, lido}]}. Em dúvida, não acusa.
export function conferirTexto(bruto) {
  const erros = [];
  let conferidas = 0;
  const tks = pedacosTexto(bruto);
  // corridas separadas por "quebra"
  const corridas = [];
  let atual = [], antes = null;
  const fecha = (depois) => { if (atual.length) { atual.antes = antes; atual.depois = depois; corridas.push(atual); } atual = []; };
  tks.forEach((k) => { if (k.t === "quebra") { fecha(k); antes = k; } else atual.push(k); });
  fecha(null);
  const txt = (lista) => lista.map((k) => (k.t === "n" ? k.txt + (k.u ? " " + k.u.base + (k.u.exp > 1 && !["L", "mL", "ha"].includes(k.u.base) ? sobrescrito(k.u.exp) : "") : "") : k.t === "pi" ? "π" : k.t === "raiz" ? "√" : k.t === "*" ? "×" : k.t === "/" ? "÷" : k.t)).join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
  corridas.forEach((cor) => {
    // divide pelas relações
    const lados = [[]], rels = [];
    cor.forEach((k) => { if (k.t === "rel") { rels.push(k.v); lados.push([]); } else lados[lados.length - 1].push(k); });
    if (!rels.length) return;
    // o primeiro lado pode ter lixo antes da conta ("Área 3 × 4"): usa o maior final válido
    const vals = lados.map((l, idx) => {
      if (!l.length) return null;
      if (idx > 0) {
        // lado direito: precisa ser uma conta completa; se termina colado numa letra ("2x"), a conta continua fora daqui
        if (idx === lados.length - 1 && cor.depois && cor.depois.palavra && (cor.depois.colado || cor.depois.letra)) return null;
        const v = avaliarPedacos(l);
        return v ? { ...v, tks: l } : null;
      }
      // lado esquerdo: não pode começar no meio de uma conta ("x + 3 = 11" não é "+ 3 = 11")
      const t0 = l[0].t;
      if (["+", "*", "/", "^", "%", ")"].includes(t0)) return null;
      if (t0 === "-" && cor.antes && cor.antes.palavra) return null;
      if (t0 === "(" && cor.antes && cor.antes.palavra && l[0].ini === cor.antes.fim) return null; // "f(2) = ..." é função, não conta
      const v = avaliarPedacos(l);
      return v ? { ...v, tks: l } : null;
    });
    for (let r = 0; r < rels.length; r++) {
      const E = vals[r], D = vals[r + 1], rel = rels[r];
      if (!E || !D) continue;
      const cadeia = r > 0 && vals[r - 1];
      const conversao = E.unidades.length === 1 && D.unidades.length === 1 && !E.temOp && !D.temOp && E.nums.length === 1 && D.nums.length === 1;
      if (!E.temOp && !D.temOp && !conversao && !cadeia && !["<", ">", "≤", "≥"].includes(rel)) continue;
      // lado esquerdo não pode ser um pedaço de conta maior (ex.: "m² × 3 = ...")
      const trecho = `${txt(E.tks)} ${rel} ${txt(D.tks)}`;
      conferidas++;
      let a = E.exato, b = D.exato;
      if (conversao) {
        const ue = E.unidades[0], ud = D.unidades[0];
        if (ue.familia !== ud.familia) continue; // famílias diferentes: não dá para comparar
        a = vezes(a, ue.fator); b = vezes(b, ud.fator);
        if (rel === "=" && !igual(a, b)) { erros.push({ trecho, esperado: `${formatar(dividido(a, ud.fator))} ${ud.base}${ud.exp > 1 && ud.familia.startsWith("c") && ud.base !== "L" && ud.base !== "mL" && ud.base !== "ha" ? sobrescrito(ud.exp) : ""}`, lido: D.nums[0].txt }); }
        continue;
      }
      // unidade de produto: m × m dá m²
      if (rel === "=" && E.soProduto && E.unidades.length >= 1 && D.unidades.length === 1 && E.unidades.every((u) => u.familia.startsWith("c") && u.base === E.unidades[0].base)) {
        const ud = D.unidades[0];
        const soma = E.unidades.reduce((t, u) => t + u.exp, 0);
        if (ud.familia.startsWith("c") && ud.base === E.unidades[0].base && ud.exp !== soma && ud.base !== "L" && ud.base !== "mL") {
          erros.push({ trecho, esperado: `unidade ${ud.base}${soma > 1 ? sobrescrito(soma) : ""}`, lido: `${ud.base}${ud.exp > 1 ? sobrescrito(ud.exp) : ""}` });
          continue;
        }
      }
      const aproximado = E.pi || D.pi || E.irracional || D.irracional;
      // soma de comprimentos dá comprimento (2 m + 3 m = 5 m, nunca 5 m²)
      const soSoma = (X) => X.tks.every((k) => ["n", "+", "-", "(", ")"].includes(k.t));
      if (rel === "=" && soSoma(E) && E.unidades.length && E.unidades.every((u) => u.familia === E.unidades[0].familia) && D.unidades.length === 1 && D.unidades[0].familia !== E.unidades[0].familia) {
        erros.push({ trecho, esperado: "a mesma unidade dos termos somados", lido: txt(D.tks) });
        continue;
      }
      // os dois lados com unidades da mesma grandeza: compara em unidades-base ("2 h = 2 × 60 min")
      if (rel === "=" && E.si && D.si && E.si.familia === D.si.familia && !aproximado) {
        if (!igual(E.si.valor, D.si.valor)) erros.push({ trecho, esperado: "valores diferentes nas unidades", lido: txt(D.tks) });
        continue;
      }
      // só um lado com unidade e o outro é conta sem unidade ("3 h = 3 × 60"): conversão implícita, não arrisca
      if (E.unidades.length && !D.unidades.length && !E.temOp && D.temOp) continue;
      if (rel === "=") {
        if (D.nums.length === 1 && D.nums[0].resto && !D.temOp) {
          // "7 ÷ 2 = 3 resto 1"
          const q = D.nums[0].v, rr = D.nums[0].resto;
          const tk = E.tks;
          if (tk.length === 3 && tk[0].t === "n" && tk[1].t === "/" && tk[2].t === "n" && ehInteiro(tk[0].v) && ehInteiro(tk[2].v) && ehInteiro(q)) {
            const ok = tk[0].v.n === tk[2].v.n * q.n + rr.n && rr.n >= 0n && rr.n < tk[2].v.n;
            if (!ok) erros.push({ trecho: trecho + " resto " + formatar(rr), esperado: `${tk[0].v.n / tk[2].v.n} resto ${tk[0].v.n % tk[2].v.n}`, lido: `${formatar(q)} resto ${formatar(rr)}` });
          }
          continue;
        }
        if (D.nums.length === 1 && D.nums[0].trunc && !D.temOp) {
          // "10 ÷ 3 = 3,333..." : os algarismos escritos precisam ser o começo do valor
          const unidade = F(1n, 10n ** BigInt(casasDoTexto(D.nums[0].txt)));
          const dif = menos(absF(a), absF(b));
          if (comparar(dif, ZERO) < 0 || comparar(dif, unidade) >= 0 || (a.n < 0n) !== (b.n < 0n)) erros.push({ trecho, esperado: aproximar(a, casasDoTexto(D.nums[0].txt) + 1), lido: D.nums[0].txt });
          continue;
        }
        if (aproximado) {
          // com π ou raiz não exata, "=" só vale se for igual de verdade (ex.: π = π); senão precisa de ≈
          if (!igual(E.fino, D.fino)) erros.push({ trecho, esperado: `use ≈ (${aproximar(E.fino, 2)}${E.pi || D.pi ? ", π não é exatamente 3,14" : ""})`, lido: "=" });
          continue;
        }
        if (!igual(a, b)) erros.push({ trecho, esperado: formatar(a), lido: formatar(b) });
        continue;
      }
      if (rel === "≈") {
        const lado = !D.temOp ? D : !E.temOp ? E : D;
        const tol = F(1n, 2n * 10n ** BigInt(Math.max(0, ...lado.nums.map((k) => casasDoTexto(k.txt)))));
        const perto = (x, y) => comparar(absF(menos(x, y)), tol) <= 0 || comparar(absF(menos(x, y)), F(1n, 10n ** 12n)) <= 0;
        const trunca = (x, y) => { const u = F(1n, 10n ** BigInt(Math.max(0, ...lado.nums.map((k) => casasDoTexto(k.txt))))); const d = menos(absF(x), absF(y)); return (x.n < 0n) === (y.n < 0n) && comparar(d, ZERO) >= 0 && comparar(d, u) < 0; };
        const ok = perto(E.fino, D.fino) || ((E.pi || D.pi) && perto(E.exato, D.exato)) || (lado === D && trunca(E.fino, D.fino));
        if (!ok) erros.push({ trecho, esperado: aproximar(E.fino, 3), lido: formatar(D.exato) });
        continue;
      }
      // < > ≤ ≥
      const cmp = comparar(E.fino, D.fino);
      const ok = rel === "<" ? cmp < 0 : rel === ">" ? cmp > 0 : rel === "≤" ? cmp <= 0 : cmp >= 0;
      if (!ok) erros.push({ trecho, esperado: `${aproximar(E.fino)} ${cmp < 0 ? "<" : cmp > 0 ? ">" : "="} ${aproximar(D.fino)}`, lido: rel });
    }
  });
  // frases com palavras: "o dobro de 7 é 14", "25% de 80 é 20", "5 ao quadrado é 25", "raiz quadrada de 49 é 7"
  const N = "(\\d{1,3}(?:[ .]\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?)";
  const frase = String(bruto).replace(/\*/g, "").replace(/ /g, " ");
  const padroes = [
    [new RegExp(`\\b(dobro|triplo|qu[aá]druplo|metade|ter[cç]o|quarta parte) de ${N} (?:é|vale|=) (?:igual a )?${N}`, "giu"), (m) => {
      const k = { dobro: F(2n), triplo: F(3n), "quádruplo": F(4n), "quadruplo": F(4n), metade: F(1n, 2n), "terço": F(1n, 3n), "terco": F(1n, 3n), "quarta parte": F(1n, 4n) }[m[1].toLowerCase()];
      return [vezes(k, lerNumero(m[2])), m[3]];
    }],
    [new RegExp(`${N} ?% de ${N} (?:é|vale|dá|da) (?:igual a )?${N}`, "giu"), (m) => [vezes(dividido(lerNumero(m[1]), F(100n)), lerNumero(m[2])), m[3]]],
    [new RegExp(`${N} (?:elevado )?ao (quadrado|cubo) (?:é|vale|dá|=) (?:igual a )?${N}`, "giu"), (m) => [potencia(lerNumero(m[1]), m[2] === "cubo" ? 3 : 2), m[3]]],
  ];
  padroes.forEach(([re, f]) => {
    for (const m of frase.matchAll(re)) {
      try {
        const [esp, lidoTxt] = f(m);
        conferidas++;
        if (!igual(esp, lerNumero(lidoTxt))) erros.push({ trecho: m[0], esperado: formatar(esp), lido: lidoTxt });
      } catch { /* ignora */ }
    }
  });
  const rq = new RegExp(`raiz quadrada de ${N} (?:é|vale|dá|=) (?:igual a )?${N}`, "giu");
  for (const m of frase.matchAll(rq)) {
    try { const a = lerNumero(m[1]), b = lerNumero(m[2]); conferidas++; if (!igual(vezes(b, b), a)) erros.push({ trecho: m[0], esperado: `um número que ao quadrado dá ${m[1]}`, lido: m[2] }); } catch { /* ignora */ }
  }
  return { conferidas, erros };
}

/* ---------------- polinômios (gráfico de função) ---------------- */
// Lê "2x² − 3x + 1" como polinômio EXATO em x: coeficientes [c0, c1, c2, ...].
// Só aceita + − × ÷ (dividir só por número), potências inteiras ≥ 0 e parênteses.
// Qualquer coisa que não seja polinômio (ex.: 1/x) dá erro.
const pAjusta = (p) => { const q = p.slice(); while (q.length > 1 && ehZero(q[q.length - 1])) q.pop(); return q; };
const pSoma = (p, q) => pAjusta(Array.from({ length: Math.max(p.length, q.length) }, (_, i) => soma(p[i] || ZERO, q[i] || ZERO)));
const pNeg = (p) => p.map(neg);
function pVezes(p, q) {
  const r = Array.from({ length: p.length + q.length - 1 }, () => ZERO);
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j] = soma(r[i + j], vezes(a, b)); }));
  return pAjusta(r);
}
export function polinomio(bruto, letra = "x") {
  const tk = tokenizar(normalizar(bruto), { implicita: true });
  let p = 0;
  const olha = () => tk[p];
  const come = (t) => { if (!tk[p] || tk[p].t !== t) throw new Error("Expressão incompleta"); p++; };
  const constante = (q) => q.length === 1;
  function primario() {
    const k = olha();
    if (!k) throw new Error("Expressão incompleta");
    if (k.t === "n") { p++; return [k.v]; }
    if (k.t === "id") { p++; if (k.v === letra) return [ZERO, UM]; throw new Error(`Letra "${k.v}" não é a variável ${letra}`); }
    if (k.t === "(") { p++; const v = somaP(); come(")"); return v; }
    throw new Error("Expressão inválida");
  }
  function pos() {
    let b = primario();
    while (olha() && olha().t === "^") {
      p++;
      const e = pos();
      if (!constante(e) || !ehInteiro(e[0]) || e[0].n < 0n || e[0].n > 6n) throw new Error("Expoente precisa ser inteiro de 0 a 6");
      const k = Number(e[0].n);
      if (k === 0 && constante(b) && ehZero(b[0])) throw new Error("0 elevado a 0 não é definido");
      let r = [UM];
      for (let i = 0; i < k; i++) r = pVezes(r, b);
      b = r;
    }
    return b;
  }
  function unario() {
    if (olha() && olha().t === "-") { p++; return pNeg(unario()); }
    if (olha() && olha().t === "+") { p++; return unario(); }
    return pos();
  }
  function termo() {
    let v = unario();
    for (;;) {
      const k = olha();
      if (k && k.t === "*") { p++; v = pVezes(v, unario()); }
      else if (k && k.t === "/") { p++; const d = unario(); if (!constante(d)) throw new Error(`Dividir por ${letra} não é permitido no gráfico`); if (ehZero(d[0])) throw new Error("Divisão por zero"); v = v.map((c) => dividido(c, d[0])); }
      else if (k && (k.t === "id" || k.t === "(" || (k.t === "n" && tk[p - 1] && tk[p - 1].t === ")"))) { v = pVezes(v, pos()); }
      else break;
    }
    return v;
  }
  function somaP() {
    let v = termo();
    for (;;) {
      const k = olha();
      if (k && k.t === "+") { p++; v = pSoma(v, termo()); }
      else if (k && k.t === "-") { p++; v = pSoma(v, pNeg(termo())); }
      else break;
    }
    return v;
  }
  const r = somaP();
  if (p < tk.length) throw new Error("Sobrou texto na expressão");
  return pAjusta(r);
}
export function valorPolinomio(c, x) { let r = ZERO; for (let i = c.length - 1; i >= 0; i--) r = soma(vezes(r, x), c[i]); return r; }
// Raiz quadrada exata de uma fração (ou null)
export function raizExata(x) {
  if (x.n < 0n) return null;
  const rq = (b) => { if (b < 2n) return b; let r = BigInt(Math.floor(Math.sqrt(Number(b)))); while (r * r > b) r--; while ((r + 1n) * (r + 1n) <= b) r++; return r * r === b ? r : null; };
  const a = rq(x.n), b = rq(x.d);
  return a != null && b != null ? F(a, b) : null;
}

/* ---------------- valor escrito numa alternativa ---------------- */
// "40 m²" -> 40 ; "−5" -> −5 ; "1/4" -> 0,25 ; "10²" -> 100 ; "1.500" -> 1500 ; "25%" -> 0,25 (ou 25) ;
// "entre 20 e 30" -> faixa. Texto sem um único número claro -> null (não arrisca).
export function valorDeTexto(bruto) {
  let t = String(bruto || "").replace(/\*/g, "").replace(/ /g, " ").trim();
  // na alternativa vale o que o ALUNO lê: "1.500" = mil e quinhentos (ponto de milhar, padrão brasileiro)
  const np = normalizarPontos(t);
  t = np.texto.replace(/(?<![\d.,])([1-9]\d{0,2})\.(\d{3})(?![\d.,])/g, "$1 $2");
  if (/(?<![\d])\.\d/.test(t)) return null;
  t = t.replace(/(?<=[\d)])\s*(km\/h|m\/s)(?![\p{L}])/gu, "");
  const fx = /(?:entre|de)\s+(-?[\d ,]+?)\s*(?:[a-zA-Zµ²³\/]+\s*)?(?:e|a|até)\s+(-?[\d ,]+)/i.exec(t);
  if (fx) {
    try {
      let lo = lerNumero(fx[1].trim()), hi = lerNumero(fx[2].trim());
      if (comparar(lo, hi) > 0) [lo, hi] = [hi, lo];
      return { valor: null, faixa: [lo, hi] };
    } catch { /* segue */ }
  }
  // "mais de 40", "até 5", "±3", "1½": não é um valor único
  if (/\b(mais|menos|acima|abaixo|pelo menos|no m[aá]ximo|no m[ií]nimo|at[eé]|quase|cerca|aproximadamente|superior|inferior)\b|[±½¼¾⅓⅔⅛]|[<>≤≥]/i.test(t)) return null;
  const tks = pedacosTexto(t);
  const corridas = [];
  let atual = [];
  tks.forEach((k) => { if (k.t === "quebra") { if (atual.length) corridas.push(atual); atual = []; } else atual.push(k); });
  if (atual.length) corridas.push(atual);
  if (corridas.length !== 1) return null;
  let c = corridas[0];
  const ir = c.map((k) => k.t).lastIndexOf("rel");
  if (ir >= 0) c = c.slice(ir + 1);
  const v = avaliarPedacos(c);
  if (!v || v.pi || v.irracional) return null;
  return { valor: v.exato, faixa: null, pct: c.length >= 2 && c[c.length - 1].t === "%" };
}
// Qual alternativa tem o valor? {indice} | {indice:null, motivo:"nenhuma"|"varias"|"ilegivel"}
// opcoes: { fino } = valor com π verdadeiro (quando a conta usa π); { porcento } = a conta dá um número "em %".
export function acharAlternativa(alternativas, valor, { fino = null, porcento = false } = {}) {
  const lidas = alternativas.map((a) => ({ l: valorDeTexto(a), casas: (String(a).replace(/\s/g, "").match(/,(\d+)/) || ["", ""])[1].length }));
  const certas = [];
  const exato = ehDecimalExato(valor) && !fino;
  lidas.forEach(({ l, casas }, i) => {
    if (!l) return;
    if (l.faixa) { if (comparar(valor, l.faixa[0]) >= 0 && comparar(valor, l.faixa[1]) <= 0) certas.push(i); return; }
    const alvo = l.pct && porcento ? vezes(l.valor, F(100n)) : l.valor;
    if (igual(alvo, valor)) { certas.push(i); return; }
    if (!exato && casas >= 1) {
      // valor não exato (dízima ou π): vale a alternativa arredondada (ou truncada) nas casas que ela mostra
      const tol = F(1n, 2n * 10n ** BigInt(casas));
      const perto = (v) => comparar(absF(menos(v, alvo)), tol) <= 0;
      if (perto(valor) || (fino && perto(fino))) certas.push(i);
    }
  });
  if (certas.length === 1) return { indice: certas[0] };
  if (certas.length > 1) return { indice: null, motivo: "varias", quais: certas };
  return { indice: null, motivo: lidas.every((x) => x.l) ? "nenhuma" : "ilegivel" };
}

/* ---------------- equação do 1º grau ---------------- */
// Texto de "a·x": 3x, −x, 0,5x, x/4, −x/4, (2/3)x.  fr: preferir fração (a equação não tinha vírgula)
function coefTxt(a, letra, fr = true) {
  if (igual(a, UM)) return letra;
  if (igual(a, neg(UM))) return "−" + letra;
  const n = a.n < 0n ? -a.n : a.n, sin = a.n < 0n ? "−" : "";
  if (a.d !== 1n && (fr || !ehDecimalExato(a))) {
    if (n === 1n) return `${sin}${letra}/${a.d}`;
    return `${sin}(${n}/${a.d})${letra}`;
  }
  return formatar(a) + letra;
}
// Soma de termos com sinais: [["x", 3], ["c", -11]] -> "3x − 11"
function juntar(termos, letra, fr = true) {
  const partes = termos.filter(([, v]) => !ehZero(v));
  if (!partes.length) return "0";
  return partes.map(([tipo, v], i) => {
    const negativo = v.n < 0n, abs = negativo ? neg(v) : v;
    const t = tipo === "x" ? coefTxt(abs, letra, fr) : formatar(abs);
    const tt = tipo === "c" && !ehDecimalExato(abs) ? `(${t})` : t;
    if (i === 0) return (negativo ? "−" : "") + tt;
    return (negativo ? " − " : " + ") + tt;
  }).join("");
}
const lado = (co, letra, fr) => juntar([["x", co.a], ["c", co.b]], letra, fr);

// Confere um passo "E = D" da resolução: precisa ter exatamente a mesma solução.
function conferirPasso(texto, x, sol) {
  const [e, d] = texto.split("=");
  const L = avaliarLinear(e, { incognita: x, implicita: true });
  const R = avaliarLinear(d, { incognita: x, implicita: true });
  const A = menos(L.a, R.a), B = menos(R.b, L.b);
  if (ehZero(A) || !igual(dividido(B, A), sol)) throw new Error(`Erro interno: o passo "${texto}" não tem a mesma solução.`);
}

// Resolve "2x + 3 = 11" e devolve os passos (todos calculados aqui e todos reconferidos).
export function resolverEquacao(bruto) {
  const partes = String(bruto).split("=");
  if (partes.length !== 2) throw new Error("A equação precisa ter um único sinal de =");
  const letras = [...new Set((String(bruto).match(/\p{L}/gu) || []))];
  if (letras.length !== 1) throw new Error("Use uma só letra como incógnita");
  const x = letras[0];
  if (/^[xX]$/.test(x) && /\d\s*[xX]\s*[\d(]/.test(String(bruto).replace(/\d\s*[xX]\s*[+\-−=)]/g, "")))
    throw new Error("Use × para multiplicar: o x desta equação é a incógnita.");
  const L = avaliarLinear(partes[0], { incognita: x, implicita: true });
  const R = avaliarLinear(partes[1], { incognita: x, implicita: true });
  const A = menos(L.a, R.a);
  if (ehZero(A)) throw new Error(igual(L.b, R.b) ? "Esta equação vale para qualquer valor (infinitas soluções)." : "Esta equação não tem solução.");
  const B = menos(R.b, L.b);
  const sol = dividido(B, A);
  const passos = [];
  const fr = !/[,.]\d/.test(String(bruto)); // sem vírgula na equação: coeficientes como fração (x/4), não 0,25x
  const original = escreverConta(partes[0], {}, { compacto: true }) + " = " + escreverConta(partes[1], {}, { compacto: true });
  passos.push({ texto: original, nota: "Vamos resolver a equação, passo a passo." });
  // 1º: organiza cada lado (parênteses, contas com o x...), se o texto ainda não estiver assim
  const semEsp = (t) => String(t).replace(/[\s*×]/g, "").replace(/-/g, "−").replace(/÷/g, "/");
  const org = `${lado(L, x, fr)} = ${lado(R, x, fr)}`;
  if (semEsp(org) !== semEsp(original)) passos.push({ texto: org, nota: "Organizamos cada lado: fazemos as contas que dá para fazer" });
  // passar termos: x para a esquerda, números para a direita
  const temXdir = !ehZero(R.a), temCesq = !ehZero(L.b);
  if (temXdir || temCesq) {
    const esq = juntar([["x", L.a], ["x", neg(R.a)]], x, fr);
    const dir = juntar([["c", R.b], ["c", neg(L.b)]], x, fr);
    passos.push({ texto: `${esq} = ${dir}`, nota: "Passamos os x para um lado e os números para o outro (a operação inverte)" });
  }
  const passoAx = `${coefTxt(A, x, fr)} = ${juntar([["c", B]], x, fr)}`;
  if (semEsp(passos[passos.length - 1].texto) !== semEsp(passoAx)) passos.push({ texto: passoAx, nota: "Fazemos as contas de cada lado" });
  if (!igual(A, UM)) {
    const Bt = B.n < 0n || !ehDecimalExato(B) ? `(${formatar(B)})` : formatar(B);
    if (igual(A, neg(UM))) {
      passos.push({ texto: `${x} = ${formatar(neg(B))}`, nota: `Trocamos o sinal dos dois lados` });
    } else if (A.n === 1n && A.d !== 1n && fr) {
      passos.push({ texto: `${x} = ${Bt} × ${A.d}`, nota: `O ${A.d} está dividindo o ${x}: passa multiplicando` });
    } else if (ehInteiro(A) || (ehDecimalExato(A) && !fr)) {
      const At = A.n < 0n ? `(${formatar(A)})` : formatar(A);
      passos.push({ texto: `${x} = ${Bt} ÷ ${At}`, nota: `O ${formatar(A)} está multiplicando o ${x}: passa dividindo` });
    } else {
      // dividir por n/d = multiplicar por d/n
      const inv = dividido(UM, A);
      const invT = ehInteiro(inv) ? (inv.n < 0n ? `(${formatar(inv)})` : formatar(inv)) : `(${inv.n < 0n ? "−" : ""}${inv.n < 0n ? -inv.n : inv.n}/${inv.d})`;
      const At = `${A.n < 0n ? "−" : ""}${A.n < 0n ? -A.n : A.n}/${A.d}`;
      passos.push({ texto: `${x} = ${Bt} × ${invT}`, nota: `Dividir por ${At} é o mesmo que multiplicar por ${invT.replace(/[()]/g, "")}` });
    }
  }
  passos.push({ texto: `${x} = *${formatarComAprox(sol)}*`, nota: "Resultado", resultado: true });
  // todo passo escrito precisa ter a mesma solução (releitura do texto)
  passos.forEach((ps) => conferirPasso(ps.texto.replace(/\*/g, "").replace(/≈.*$/, ""), x, sol));
  // conferência: coloca o valor no lugar do x
  const valEsq = soma(vezes(L.a, sol), L.b), valDir = soma(vezes(R.a, sol), R.b);
  const ok = igual(valEsq, valDir);
  const cE = escreverConta(partes[0], { [x]: sol }), cD = escreverConta(partes[1], { [x]: sol });
  if (!igual(avaliar(cE), valEsq) || !igual(avaliar(cD), valDir)) throw new Error("Erro interno: a conferência escrita não bate.");
  passos.push({ texto: `Conferindo: ${cE} = ${formatar(valEsq)}   e   ${cD} = ${formatar(valDir)} ${ok ? "✓" : "✗"}`, nota: "Conferência", conferencia: true, ok });
  return { variavel: x, solucao: sol, passos, ok };
}

/* ---------------- escrever contas para o aluno ---------------- */
// Reescreve uma expressão com os sinais explícitos (2x -> 2 × x; 2(x+1) -> 2 × (x + 1)),
// trocando as letras pelos valores (negativos e frações entre parênteses; π -> 3,14).
// Devolve o texto pronto (×, ÷, −, expoentes sobrescritos).
function valorTxt(v) {
  if (typeof v === "string") v = lerNumero(v);
  const t = formatar(v);
  return v.n < 0n || !ehDecimalExato(v) ? `(${t})` : t;
}
export function escreverConta(bruto, vars = {}, { compacto = false } = {}) {
  const tk = tokenizar(normalizar(bruto), { implicita: true });
  const out = [];
  const operando = (k) => k && (k.t === "n" || k.t === "id" || k.t === "(");
  const fimOperando = (k) => k && (k.t === "n" || k.t === "id" || k.t === ")" || k.t === "%" || k.t === "exp");
  let ant = null;
  for (let i = 0; i < tk.length; i++) {
    const k = tk[i];
    // fração entre parênteses "(3/4)" fica escrita como fração
    if (k.t === "(" && tk[i + 1] && tk[i + 1].t === "n" && tk[i + 2] && tk[i + 2].t === "/" && tk[i + 3] && tk[i + 3].t === "n" && tk[i + 4] && tk[i + 4].t === ")" && ehInteiro(tk[i + 1].v) && ehInteiro(tk[i + 3].v)) {
      if (fimOperando(ant)) out.push(" × ");
      out.push(`(${formatar(tk[i + 1].v, { milhar: false })}/${formatar(tk[i + 3].v, { milhar: false })})`);
      i += 4; ant = { t: ")" }; continue;
    }
    if (fimOperando(ant) && operando(k)) {
      const junta = compacto && ant.t === "n" && k.t === "id" && !Object.prototype.hasOwnProperty.call(vars, k.v); // "2x" continua "2x"
      out.push(junta ? "" : " × ");
    }
    if (k.t === "n") out.push(formatar(k.v, { milhar: true }));
    else if (k.t === "id") {
      if (k.v === "π" || k.v === "pi") out.push(vars.pi != null ? valorTxt(vars.pi) : (Object.keys(vars).length ? "3,14" : "π"));
      else if (Object.prototype.hasOwnProperty.call(vars, k.v)) out.push(valorTxt(vars[k.v]));
      else out.push(k.v);
    } else if (k.t === "^") {
      // expoente simples (número inteiro, com ou sem sinal) vira sobrescrito
      const a = tk[i + 1], b = tk[i + 2];
      const depois = tk[i + 2] && tk[i + 2].t === "^"; // 2^3^2: não usa sobrescrito (ficaria 2³²)
      if (!depois && a && a.t === "n" && ehInteiro(a.v) && a.v.n >= 0n) { out.push(sobrescrito(a.v.n)); i += 1; ant = { t: "exp" }; continue; }
      if (a && a.t === "-" && b && b.t === "n" && ehInteiro(b.v)) { out.push("⁻" + sobrescrito(b.v.n)); i += 2; ant = { t: "exp" }; continue; }
      out.push("^");
    } else if (k.t === "-") {
      const unario = !ant || ["(", "+", "-", "*", "/", "^"].includes(ant.t);
      out.push(unario ? "−" : " − ");
    } else if (k.t === "+") out.push(ant && ant.t !== "(" ? " + " : "+");
    else if (k.t === "*") out.push(" × ");
    else if (k.t === "/") out.push(" ÷ ");
    else out.push(k.t);
    ant = k;
  }
  return out.join("").replace(/\s+/g, " ").trim();
}

// Substitui as variáveis numa fórmula "A = b × h" e calcula. Devolve os textos.
// Toda conta escrita é relida e recalculada: se o texto não der o mesmo valor, é erro.
export function calcularFormula(formula, valores, unidades = {}) {
  const partes = String(formula).split("=");
  if (partes.length !== 2) throw new Error("A fórmula precisa ter um único =");
  const alvo = partes[0].trim();
  const rhs = partes[1].trim();
  if (!/^\p{L}[\p{L}\d_]*$/u.test(alvo)) throw new Error(`O lado esquerdo da fórmula precisa ser uma letra (ex.: "A = b × h"), não "${alvo}".`);
  const vars = { ...valores };
  Object.keys(vars).forEach((k) => { lerNumero(vars[k]); }); // valor inválido: erro já aqui
  const resultado = avaliar(rhs, { vars, implicita: true });
  const pi = usaPi(rhs);
  const conta = escreverConta(rhs, vars);
  const releitura = avaliar(conta, { implicita: false, vars: pi ? { pi: vars.pi != null ? vars.pi : "3,14" } : {} });
  if (!igual(releitura, resultado)) throw new Error(`Erro interno: a conta escrita "${conta}" não dá o valor calculado.`);
  const r = mostrarResultado(resultado, { pi });
  const un = unidades[alvo] || "";
  return {
    alvo,
    formula: `${alvo} = ${escreverConta(rhs, {}, { compacto: true })}`,
    substituido: `${alvo} ${pi ? "≈" : "="} ${conta}`,
    resultado,
    resultadoTxt: r.texto,
    sinal: r.sinal,
    unidade: un,
    usaPi: pi,
    pi: vars.pi != null ? String(vars.pi) : "3,14",
  };
}
