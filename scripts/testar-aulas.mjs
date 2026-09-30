// Testes automáticos do gerador de aulas animadas. Rode com:  npm run testar:aulas
// 1) planos de exemplo compilam e passam no verificador;
// 2) erros de conta plantados são pegos;
// 3) "lixo" (planos malformados, como uma IA distraída poderia mandar) NUNCA derruba o sistema;
// 4) tudo que o compilador aceita também passa no verificador (os dois concordam);
// 5) contas exatas batem com o cálculo em ponto flutuante em milhares de casos.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilarAula, normalizarPlano } from "../src/utils/compiladorAula.js";
import { verificarAula } from "../src/utils/verificadorAula.js";
import * as M from "../src/utils/matematicaExata.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
let falhas = 0, total = 0;
const ok = (cond, msg) => { total++; if (!cond) { falhas++; console.log("  FALHOU:", msg); } };
const secao = (t) => console.log("\n" + t);

// gerador pseudo-aleatório com semente (resultado sempre igual)
let semente = 12345;
const rnd = () => { semente = (semente * 1664525 + 1013904223) % 4294967296; return semente / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

/* 1 e 4 — planos de exemplo */
secao("1) Planos de exemplo");
const dir = path.join(aqui, "planos-exemplo");
const exemplos = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
for (const f of exemplos) {
  const plano = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const r = compilarAula(plano, { assinatura: "teste" });
  ok(r.relatorio.erros.length === 0, `${f}: compilou com erros: ${r.relatorio.erros.join(" | ")}`);
  const v = verificarAula(r.aula);
  ok(v.ok, `${f}: verificador achou erros: ${v.erros.join(" | ")}`);
  const r2 = compilarAula(plano, { assinatura: "teste" });
  ok(JSON.stringify(r.aula) === JSON.stringify(r2.aula), `${f}: compilar duas vezes deu resultados diferentes`);
  ok(r.aula.passos.length >= 5 && r.aula.passos.length <= 45, `${f}: número de passos estranho (${r.aula.passos.length})`);
  console.log(`  ${f}: ${r.aula.passos.length} passos, ${v.verificadas} conferências`);
}

/* 2 — contas erradas plantadas */
secao("2) Contas erradas são pegas");
{
  const plano = JSON.parse(fs.readFileSync(path.join(dir, exemplos[0]), "utf8"));
  const { aula } = compilarAula(plano, { assinatura: "t" });
  // acha textos que o verificador sabe conferir ("A op B = C") e troca o resultado por um errado
  const achar = (x, dono, chave, saida) => {
    if (typeof x === "string") { if (x.includes("=") && M.conferirTexto(x).conferidas > 0) saida.push([dono, chave, x]); }
    else if (Array.isArray(x)) x.forEach((v, i) => achar(v, x, i, saida));
    else if (x && typeof x === "object") Object.entries(x).forEach(([k, v]) => achar(v, x, k, saida));
    return saida;
  };
  let plantadas = 0, pegas = 0;
  for (const f of exemplos) {
    const plano = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const { aula } = compilarAula(plano, { assinatura: "t" });
    const candidatos = achar(aula, null, null, []);
    ok(candidatos.length > 0, `${f}: nenhuma conta escrita para testar`);
    // (as linhas "Conferindo … ✓" repetem o resultado em "40 = 40", sem operação; não são o alvo deste teste)
    for (const [, , txt] of candidatos.filter((c) => !/✓/.test(c[2])).slice(0, 6)) {
      const suja = JSON.parse(JSON.stringify(aula));
      const alvos = achar(suja, null, null, []).filter((c) => c[2] === txt);
      const [dono, chave] = alvos[0];
      // troca o ÚLTIMO resultado "= número" do texto (é o que o verificador confere)
      let errado = txt;
      const ms = [...txt.matchAll(/=\s*\*?(\d+)(?![\d,\/])/g)];
      if (ms.length) { const u = ms[ms.length - 1]; errado = txt.slice(0, u.index) + "= " + (Number(u[1]) + 7) + txt.slice(u.index + u[0].length); }
      if (errado === txt) continue;
      dono[chave] = errado;
      plantadas++;
      if (!verificarAula(suja).ok) pegas++;
      else console.log(`  não pego (${f}): "${txt}" -> "${errado}"`);
    }
  }
  ok(plantadas > 0 && pegas === plantadas, `o verificador pegou ${pegas} de ${plantadas} contas trocadas`);
  console.log(`  ${pegas}/${plantadas} contas trocadas foram pegas`);
}

/* 3 — lixo */
secao("3) Planos malformados nunca derrubam o sistema");
const tipos = ["ideia", "termo", "faixa", "conta", "coluna", "expressoes", "formula", "figura", "equacao", "desafio", "revelar", "fecho", "fracao", "grafico", "movimento", "xyz", "", null, 7];
const lixoValor = () => pick([null, undefined, 0, -1, 1e9, NaN, "", " ", "abc", "1/0", "0,0,0", "10 ÷ 0", "((((", "9".repeat(500), "*", "**a*", "\u0000\u0001", "x = x", "1 000 000 000 000", "3,14159265358979323846", [], {}, [null], [[1, 2], [3]], { a: { b: [1] } }, true, "🙂 emoji", "<script>", "a".repeat(3000)]);
const lixoBloco = () => {
  const b = {};
  ["tipo", "momento", "legenda", "titulo", "linhas", "destaque", "chave", "antes", "numero", "depois", "op", "fator", "unidadeDe", "unidadePara", "nota", "a", "b", "itens", "formula", "valores", "unidades", "variaveis", "forma", "medidas", "unidade", "equacao", "enunciado", "alternativas", "calculo", "correta", "regra", "pega", "passoAPasso", "complemento", "fonte", "mostrar", "funcao", "xmin", "xmax", "velocidade", "tempo", "deslocamento", "unidadeVelocidade"].forEach((k) => { if (rnd() < 0.5) b[k] = k === "tipo" ? pick(tipos) : lixoValor(); });
  if (rnd() < 0.5) b.tipo = pick(tipos);
  return b;
};
let lancou = 0, inconsistentes = 0;
for (let i = 0; i < 1500; i++) {
  const plano = rnd() < 0.05 ? lixoValor() : {
    titulo: pick(["Aula", "", lixoValor()]),
    termos: rnd() < 0.5 ? [lixoBloco(), lixoBloco()] : lixoValor(),
    abertura: rnd() < 0.5 ? { antes: lixoValor(), destaque: lixoValor(), depois: lixoValor(), alternativas: pick([["a", "b", "c", "d"], lixoValor()]), correta: lixoValor(), calculo: lixoValor() } : lixoValor(),
    blocos: Array.from({ length: Math.floor(rnd() * 14) }, lixoBloco),
    duvidas: lixoValor(), avisos: lixoValor(),
  };
  try {
    normalizarPlano(plano);
    const r = compilarAula(plano, { assinatura: "t" });
    if (!r || !r.aula || !r.relatorio || !Array.isArray(r.relatorio.erros)) throw new Error("retorno inválido");
    const v = verificarAula(r.aula);
    if (typeof v.ok !== "boolean") throw new Error("verificador sem resposta");
    if (r.relatorio.erros.length === 0 && !v.ok) { inconsistentes++; if (inconsistentes <= 3) console.log("  compilou sem erros mas o verificador reprovou:", v.erros.slice(0, 2)); }
  } catch (e) { lancou++; if (lancou <= 3) console.log("  EXCEÇÃO:", e.message, JSON.stringify(plano).slice(0, 200)); }
}
ok(lancou === 0, `${lancou} planos malformados derrubaram o sistema`);
ok(inconsistentes === 0, `${inconsistentes} aulas passaram no compilador e foram reprovadas pelo verificador`);
// o verificador também precisa aguentar lixo direto
for (let i = 0; i < 300; i++) {
  try { verificarAula(pick([null, undefined, 5, "x", [], {}, { passos: lixoValor() }, { titulo: "a", passos: [lixoValor(), { acoes: lixoValor() }, { momento: 1, acoes: [lixoValor(), { tipo: pick(tipos) }] }] }])); }
  catch (e) { ok(false, "verificador lançou exceção: " + e.message); break; }
}

/* 3b — blocos novos: entradas ruins viram mensagem de erro (nunca quebram) e as contas certas fecham */
secao("3b) Blocos novos (círculo, fração, gráfico, movimento)");
{
  const base = (bloco) => ({ titulo: "T", termos: [], abertura: { antes: "a", destaque: "2 × 3", depois: "b", alternativas: ["5", "6", "7", "8"], calculo: "2 × 3" }, blocos: [{ tipo: "ideia", momento: 1, titulo: "A", linhas: ["um"] }, { tipo: "ideia", momento: 1, titulo: "B", linhas: ["dois"] }, { tipo: "ideia", momento: 1, titulo: "C", linhas: ["tres"] }, bloco, { tipo: "fecho", titulo: "R", regra: ["x"], pegaTitulo: "C", pega: ["y"] }] });
  const roda = (b) => { const r = compilarAula(base(b), { assinatura: "t" }); return { erros: r.relatorio.erros, v: verificarAula(r.aula), r }; };
  const deveErrar = (nome, b) => { let r; try { r = roda(b); } catch (e) { ok(false, `${nome}: quebrou (${e.message})`); return; } ok(r.erros.length > 0, `${nome}: devia dar erro e compilou`); };
  const deveFechar = (nome, b) => { let r; try { r = roda(b); } catch (e) { ok(false, `${nome}: quebrou (${e.message})`); return; } ok(r.erros.length === 0 && r.v.ok, `${nome}: ${r.erros.concat(r.v.erros).join(" | ")}`); };
  deveErrar("fração mal escrita", { tipo: "fracao", op: "soma", a: "meio", b: "1/4" });
  deveErrar("fração > 1 inteiro", { tipo: "fracao", op: "soma", a: "3/4", b: "3/4" });
  deveErrar("subtração negativa", { tipo: "fracao", op: "subtracao", a: "1/4", b: "3/4" });
  deveErrar("denominador comum enorme", { tipo: "fracao", op: "soma", a: "1/11", b: "1/13" });
  deveErrar("fator inválido", { tipo: "fracao", op: "equivalente", a: "1/2", fator: "1" });
  deveErrar("gráfico sem função", { tipo: "grafico" });
  deveErrar("gráfico 1/x", { tipo: "grafico", funcao: "y = 1/x", xmin: -2, xmax: 2 });
  deveErrar("gráfico valores enormes", { tipo: "grafico", funcao: "y = x^9", xmin: -5, xmax: 5 });
  deveErrar("movimento com 3 dados", { tipo: "movimento", velocidade: "10", tempo: "2", deslocamento: "20" });
  deveErrar("movimento com 1 dado", { tipo: "movimento", velocidade: "10" });
  deveErrar("movimento sem unidade certa", { tipo: "movimento", velocidade: "10", tempo: "2", unidadeVelocidade: "metros" });
  deveErrar("círculo sem raio", { tipo: "figura", forma: "circulo", medidas: {}, unidade: "cm" });
  deveFechar("círculo raio decimal", { tipo: "figura", forma: "circulo", medidas: { raio: "2,5" }, unidade: "m", mostrar: "area" });
  deveFechar("círculo diâmetro ímpar", { tipo: "figura", forma: "círculo", medidas: { diametro: "7" }, unidade: "cm", mostrar: "comprimento" });
  deveFechar("fração mesma base", { tipo: "fracao", op: "soma", a: "1/5", b: "2/5" });
  deveFechar("fração que dá 1 inteiro", { tipo: "fracao", op: "soma", a: "1/2", b: "1/2" });
  deveFechar("fração simplifica", { tipo: "fracao", op: "subtracao", a: "3/4", b: "1/4" });
  deveFechar("gráfico reta com raiz inteira", { tipo: "grafico", funcao: "y = 2x − 4", xmin: -2, xmax: 4 });
  deveFechar("gráfico sem raiz", { tipo: "grafico", funcao: "y = x² + 1", xmin: -3, xmax: 3 });
  deveFechar("gráfico decrescente", { tipo: "grafico", funcao: "y = -3x + 6", xmin: -1, xmax: 4 });
  deveFechar("movimento tempo", { tipo: "movimento", velocidade: "60", deslocamento: "180", unidadeVelocidade: "km/h" });
  deveFechar("movimento decimal", { tipo: "movimento", velocidade: "2,5", tempo: "4", unidadeVelocidade: "m/s" });
  // conferência independente das somas de fração em ponto flutuante
  let n = 0;
  for (let i = 0; i < 300; i++) {
    const d1 = 2 + Math.floor(rnd() * 7), d2 = 2 + Math.floor(rnd() * 7);
    const n1 = 1 + Math.floor(rnd() * (d1 - 1)), n2 = 1 + Math.floor(rnd() * (d2 - 1));
    const soma = n1 / d1 + n2 / d2;
    const { erros, v, r } = roda({ tipo: "fracao", op: "soma", a: `${n1}/${d1}`, b: `${n2}/${d2}` });
    const mmc = (a, b) => { let x = a, y = b; while (y) [x, y] = [y, x % y]; return (a / x) * b; };
    if (soma > 1 + 1e-9 || mmc(d1, d2) > 24) { ok(erros.length > 0, `${n1}/${d1} + ${n2}/${d2} passa de 1 inteiro (ou denominador > 24) e devia dar erro`); continue; }
    n++;
    ok(erros.length === 0 && v.ok, `fração ${n1}/${d1} + ${n2}/${d2}: ${erros.concat(v.erros).join(" | ")}`);
    const conta = (r.relatorio.blocos.find((b) => b.tipo === "fracao").contas || []).find((c) => c.includes("+"));
    const m = conta && conta.match(/= (\d+)\/(\d+)$/);
    ok(m && Math.abs(Number(m[1]) / Number(m[2]) - soma) < 1e-9, `fração ${n1}/${d1} + ${n2}/${d2}: resultado "${conta}" não bate com ${soma}`);
  }
  console.log(`  ${n} somas de frações conferidas contra ponto flutuante`);
}

/* 5 — contas exatas x ponto flutuante */
secao("4) Aritmética exata confere com ponto flutuante");
{
  let erros = 0;
  for (let i = 0; i < 4000; i++) {
    const a = Math.round(rnd() * 100000) / 100, b = Math.round((rnd() * 1000 + 1)) / 10, c = Math.floor(rnd() * 90) + 1;
    const ops = [["×", (x, y) => x * y], ["÷", (x, y) => x / y], ["+", (x, y) => x + y], ["−", (x, y) => x - y]];
    const [s1, f1] = pick(ops), [s2, f2] = pick(ops);
    const txt = `(${String(a).replace(".", ",")} ${s1} ${String(b).replace(".", ",")}) ${s2} ${c}`;
    let ex;
    try { ex = M.paraNumero(M.avaliar(txt)); } catch { erros++; continue; }
    const fl = f2(f1(a, b), c);
    if (Math.abs(ex - fl) > Math.max(1e-6, Math.abs(fl) * 1e-9)) { erros++; if (erros < 4) console.log("  diferença:", txt, ex, fl); }
  }
  ok(erros === 0, `${erros} contas exatas diferentes do ponto flutuante`);
}

console.log(`\n${total - falhas}/${total} verificações passaram${falhas ? " — " + falhas + " FALHARAM" : ""}`);
process.exit(falhas ? 1 : 0);
