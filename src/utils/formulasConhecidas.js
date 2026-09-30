// Fórmulas conhecidas (geometria e movimento) para conferir o que a IA escreve em textos livres.
// Ex.: num texto sobre triângulo, "A = b × h" está ERRADO (falta ÷ 2). A conferência é feita
// trocando as letras por números e comparando com a fórmula certa (qualquer forma equivalente vale).
import * as M from "./matematicaExata.js";

const REGISTRO = [
  { nome: "quadrado", chave: /\bquadrados?\b/i, tirar: /(metros?|cent[ií]metros?|quil[oô]metros?|mil[ií]metros?|dec[ií]metros?|metro)\s+quadrad\w*|ao\s+quadrado|elevad\w*\s+ao\s+quadrado|quadradinh\w*|n[uú]meros?\s+quadrad\w*|quadrado\s+(perfeito|da|do|de)/gi, f: { A: ["l*l"], P: ["4*l"] } },
  { nome: "retângulo", chave: /\bret[aâ]ngulos?\b/i, f: { A: ["b*h", "c*l"], P: ["2*b+2*h", "2*c+2*l"] } },
  { nome: "paralelogramo", chave: /\bparalelogramos?\b/i, f: { A: ["b*h"] } },
  { nome: "triângulo", chave: /\btri[aâ]ngulos?\b/i, tirar: /tri[aâ]ngulos?\s+ret[aâ]ngulos?/gi, f: { A: ["b*h/2"] } },
  { nome: "trapézio", chave: /\btrap[eé]zios?\b/i, f: { A: ["(B+b)*h/2"] } },
  { nome: "losango", chave: /\blosangos?\b/i, f: { A: ["D*d/2"] } },
  { nome: "círculo", chave: /\bc[ií]rculos?\b|\bcircunfer[eê]ncias?\b/i, f: { A: ["π*r^2", "π*d^2/4"], C: ["2*π*r", "π*d"], d: ["2*r"] } },
  { nome: "movimento", chave: /\bvelocidades?\b|\bmovimento\b|\bMRU\b/i, f: { v: ["S/t", "d/t", "Δs/Δt", "ΔS/Δt"], S: ["v*t"], d: ["v*t"], t: ["S/v", "d/v"], Δs: ["v*Δt"] } },
];
const SINONIMOS = { "área": "A", "area": "A", "perímetro": "P", "perimetro": "P", "comprimento": "C" };

function contextos(texto) {
  return REGISTRO.filter((r) => {
    const t = r.tirar ? String(texto).replace(r.tirar, " ") : String(texto);
    return r.chave.test(t);
  });
}
const VALORES = [["3", "7", "11", "2", "5"], ["13", "4", "9", "6", "17"], ["2,5", "8", "3", "10", "7"]];
function letrasDe(expr) { return [...new Set((M.escreverConta(expr).match(/[\p{L}Δ][\p{L}\d_]*/gu) || []).filter((l) => l !== "π" && l !== "pi"))]; }
function vale(expr, vars) { return M.avaliar(expr, { vars, implicita: true }); }

// Procura "X = fórmula com letras" no texto e confere no contexto (figura/movimento) do próprio texto
// ou, se não houver, no contexto do grupo (mesmo cartão/quadro). Devolve lista de erros (strings).
export function conferirFormulas(texto, contextoGrupo = []) {
  const erros = [];
  const s = String(texto).replace(/\*/g, "");
  const ctxLinha = contextos(s);
  const ctx = ctxLinha.length ? ctxLinha : contextoGrupo;
  if (ctx.length !== 1 || !ctx[0].f) return erros;
  const reg = ctx[0];
  const re = /(^|[^\p{L}\d])([\p{L}Δ][\p{L}\d]*)\s*=\s*([^=;:,\n]+?)(?=$|[;:,\n]|\s[eé]\s|\s\(|\s{2})/gu;
  for (const m of s.matchAll(re)) {
    let alvo = m[2];
    alvo = SINONIMOS[alvo.toLowerCase()] || alvo;
    const certas = reg.f[alvo];
    if (!certas) continue;
    const rhs = m[3].replace(/\s(?!pi\b)[\p{L}]{2,}.*$/u, "").trim().replace(/[.!?]+$/, "");
    let letras;
    try { letras = letrasDe(rhs); } catch { continue; }
    if (!letras.length) continue; // só números: quem confere é o conferidor de contas
    const candidatas = certas.filter((c) => { const lc = letrasDe(c); return lc.length === letras.length && lc.every((l) => letras.includes(l)); });
    if (!candidatas.length) continue; // letras diferentes das conhecidas: não arrisca
    let ok = false;
    try {
      ok = candidatas.some((c) => VALORES.every((vs) => {
        const vars = {}; letras.forEach((l, i) => { vars[l] = vs[i % vs.length]; });
        return M.igual(vale(rhs, vars), vale(c, vars));
      }));
    } catch { continue; }
    if (!ok) erros.push(`Fórmula errada para ${reg.nome}: "${alvo} = ${rhs}" (o certo é ${alvo} = ${M.escreverConta(candidatas[0], {}, { compacto: true })}).`);
  }
  return erros;
}
export { contextos as contextosDeFormula };
