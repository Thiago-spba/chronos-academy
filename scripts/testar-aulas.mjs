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

/* 5 — rigor: cada erro já encontrado numa auditoria vira um teste permanente */
secao("5) Rigor matemático (casos da auditoria)");
{
  const base = (bloco, extra = {}) => ({ titulo: "T", termos: [], abertura: { antes: "a", destaque: "2 × 3", depois: "b", alternativas: ["5", "6", "7", "8"], calculo: "2 × 3", ...(extra.abertura || {}) }, blocos: [{ tipo: "ideia", momento: 1, titulo: "A", linhas: ["um"] }, { tipo: "ideia", momento: 1, titulo: "B", linhas: ["dois"] }, { tipo: "ideia", momento: 1, titulo: "C", linhas: ["tres"] }, bloco, { tipo: "fecho", titulo: "R", regra: ["x"], pegaTitulo: "C", pega: ["y"] }] });
  const roda = (b, extra) => { const r = compilarAula(base(b, extra), { assinatura: "t" }); return { r, erros: r.relatorio.erros, v: verificarAula(r.aula), textos: JSON.stringify(r.aula) }; };
  const aprova = (nome, b, extra) => { const x = roda(b, extra); ok(x.erros.length === 0 && x.v.ok, `${nome}: devia passar: ${x.erros.concat(x.v.erros).join(" | ")}`); return x; };
  const barra = (nome, b, extra) => { const x = roda(b, extra); ok(x.erros.length > 0 || !x.v.ok, `${nome}: devia ser barrado e passou`); return x; };
  const tem = (x, t, nome) => ok(x.textos.includes(t), `${nome}: esperava ver "${t}"`);
  const naoTem = (x, t, nome) => ok(!x.textos.includes(t), `${nome}: não podia aparecer "${t}"`);

  // equações
  let x = aprova("2x/3 = 4", { tipo: "equacao", equacao: "2x/3 = 4" }); naoTem(x, "÷ 2/3", "2x/3"); tem(x, "x = 4 × (3/2)", "2x/3");
  x = aprova("x/3 − x/4 = 1", { tipo: "equacao", equacao: "x/3 - x/4 = 1" }); tem(x, "x/12 = 1", "x/3 − x/4");
  x = aprova("0,5x = 2", { tipo: "equacao", equacao: "0,5x = 2" }); tem(x, "x = 2 ÷ 0,5", "0,5x"); naoTem(x, "O 2 está dividindo", "0,5x");
  x = aprova("11 = 2x + 3", { tipo: "equacao", equacao: "11 = 2x + 3" }); naoTem(x, "0 x", "11 = 2x + 3"); naoTem(x, "0x", "11 = 2x + 3");
  barra("x usado como vezes", { tipo: "equacao", equacao: "10 x 3 = 3x" });
  barra("equação longa não é cortada", { tipo: "equacao", equacao: "3(x - 2) + 4(x + 1) + 7(x - 9) = 2(x - 3) + 5(x + 7) - 10x + 25 - 40000x + 8(x - 1)" });
  aprova("equação de 62 letras é resolvida inteira", { tipo: "equacao", equacao: "3(x - 2) + 4(x + 1) = 2(x - 3) + 5(x + 7) - 10x + 25 - 40000x" });
  barra("sem solução", { tipo: "equacao", equacao: "2x + 1 = 2x + 3" });
  // fórmula com multiplicação implícita
  x = aprova("y = 2x + 1", { tipo: "formula", formula: "y = 2x + 1", valores: { x: "3" } }); tem(x, "y = 2 × 3 + 1", "2x com x=3"); naoTem(x, "23 + 1", "2x com x=3");
  x = aprova("F = m a", { tipo: "formula", formula: "F = m a", valores: { m: "5", a: "3" } }); tem(x, "F = 5 × 3", "F = m a");
  x = aprova("C = 2πr", { tipo: "formula", formula: "C = 2πr", valores: { r: "5" } }); tem(x, "C ≈ 2 × 3,14 × 5", "C = 2πr"); tem(x, "C ≈ *31,4", "C = 2πr");
  // π sempre com ≈
  x = aprova("expressão com π", { tipo: "expressoes", itens: [{ expr: "π × 5²" }, { expr: "2 × π × 3" }] }); tem(x, "π × 5² ≈ *78,5*", "π expr"); naoTem(x, "= *78,5", "π expr"); tem(x, "usando π ≈ 3,14", "π expr");
  x = aprova("círculo com ≈", { tipo: "figura", forma: "circulo", medidas: { raio: "5" }, unidade: "cm" }); tem(x, "A ≈ *78,5 cm²*", "círculo"); tem(x, "(usando π ≈ 3,14)", "círculo"); naoTem(x, "A = *78,5", "círculo");
  x = aprova("círculo pequeno", { tipo: "figura", forma: "circulo", medidas: { raio: "0,125" }, unidade: "m" }); naoTem(x, "0,0490625", "círculo pequeno");
  // potências e o asterisco
  x = aprova("2^3^2", { tipo: "expressoes", itens: [{ expr: "2^3^2" }] }); tem(x, "*512*", "2^3^2");
  x = aprova("asterisco é vezes", { tipo: "expressoes", itens: [{ expr: "2*3" }, { expr: "12*5 + 3*4" }] }); tem(x, "2 × 3 = *6*", "2*3"); tem(x, "12 × 5 + 3 × 4 = *72*", "12*5+3*4");
  x = aprova("desafio com *", { tipo: "desafio", enunciado: ["Área de 25 por 12?"], alternativas: ["37 m²", "300 m²", "150 m²", "600 m²"], calculo: "25*12", unidade: "m²" }); tem(x, "25 × 12 = *300 m²*", "calculo 25*12");
  // conta armada e conversões
  barra("coluna com negativo (sub)", { tipo: "coluna", op: "sub", a: "-2", b: "-5" });
  barra("coluna com negativo (add)", { tipo: "coluna", op: "add", a: "-2", b: "5" });
  x = aprova("coluna com ponto decimal", { tipo: "coluna", op: "add", a: "2.5", b: "1,2" }); tem(x, "\"resultado\":\"3,7\"", "2.5 + 1,2");
  barra("m² para cm² não é × 100", { tipo: "conta", numero: "5", op: "mul", fator: "100", unidadeDe: "m²", unidadePara: "cm²" });
  aprova("m² para cm² é × 10 000", { tipo: "conta", numero: "5", op: "mul", fator: "10000", unidadeDe: "m²", unidadePara: "cm²" });
  barra("km para m não é × 100", { tipo: "conta", numero: "3", op: "mul", fator: "100", unidadeDe: "km", unidadePara: "m" });
  aprova("cm para m é ÷ 100", { tipo: "conta", numero: "250", op: "div", fator: "100", unidadeDe: "cm", unidadePara: "m" });
  barra("figura com unidade de área", { tipo: "figura", forma: "retangulo", medidas: { base: "3", altura: "2" }, unidade: "cm²" });
  aprova("subtração com sinal unicode", { tipo: "coluna", op: "−", a: "9", b: "4" });
  // alternativas
  barra("alternativa negativa não confunde", { tipo: "desafio", enunciado: ["2 + 3?"], alternativas: ["−5", "3", "10", "1"], calculo: "2 + 3" });
  barra("fração na alternativa não vira faixa", { tipo: "desafio", enunciado: ["6 ÷ 2?"], alternativas: ["1/4", "2", "6", "12"], calculo: "6 ÷ 2", correta: 2 });
  x = aprova("potência na alternativa", { tipo: "desafio", enunciado: ["5 + 5?"], alternativas: ["10²", "10", "1 000", "10 000"], calculo: "5 + 5" }); tem(x, "Alternativa B ✓", "10² vs 10");
  x = aprova("milhar com ponto", { tipo: "desafio", enunciado: ["150 × 10?"], alternativas: ["1.500", "200", "400", "600"], calculo: "150 × 10" }); tem(x, "Alternativa A ✓", "1.500");
  barra("duas alternativas com o mesmo valor", { tipo: "desafio", enunciado: ["1 ÷ 2?"], alternativas: ["0,5", "1/2", "2", "3"], calculo: "1 ÷ 2" });
  barra("IA marcou outra alternativa", { tipo: "desafio", enunciado: ["(15 + 5) × 4 ÷ 2?"], alternativas: ["20 m²", "40 m²", "60 m²", "300 m²"], calculo: "(15 + 5) × 4 ÷ 2", correta: 2 });
  barra("abertura com correta errada", { tipo: "ideia", titulo: "x", linhas: ["y"] }, { abertura: { correta: 0 } });
  // gráfico
  x = aprova("parábola com raiz 0,5", { tipo: "grafico", funcao: "y = 2x² − 3x + 1" }); tem(x, "x = 0,5 e x = 1", "2x²−3x+1");
  x = aprova("raiz irracional", { tipo: "grafico", funcao: "y = x² − 2" }); tem(x, "x ≈ −1,41 e x ≈ 1,41", "x²−2");
  x = aprova("parábola sem raiz", { tipo: "grafico", funcao: "y = x² + 1" }); tem(x, "não corta", "x²+1");
  x = aprova("parábola que toca", { tipo: "grafico", funcao: "y = (x − 1)²" }); tem(x, "toca o eixo x", "(x−1)²");
  x = aprova("reta com raiz 1/3", { tipo: "grafico", funcao: "y = 3x − 1" }); tem(x, "1/3", "3x−1");
  x = aprova("função fatorada", { tipo: "grafico", funcao: "y = x(x − 2)" });
  barra("hipérbole não é desenhada como curva contínua", { tipo: "grafico", funcao: "y = 2/(x − 0,4)" });
  barra("3º grau", { tipo: "grafico", funcao: "y = x^3" });
  // movimento
  barra("aceleração não é velocidade", { tipo: "movimento", velocidade: "2", tempo: "3", unidadeVelocidade: "m/s²" });
  // números pequenos e 0^0
  ok(M.aproximar(M.F(1n, 3000n)) === "0,000333", "1/3000 não pode virar 0");
  let zz = false; try { M.avaliar("0^0"); } catch { zz = true; } ok(zz, "0^0 precisa dar erro");
  // textos livres da IA: erros de conta e de fórmula precisam ser pegos
  const falsos = ["2 + 3 × 4 = 20", "8 m × 5 m = 45 m²", "5 cm × 3 cm = 15 cm", "1/2 + 1/3 = 2/5", "π × 5² = 78,6", "π × 5² = 78,5", "√9 = 4", "2 + 2 ≈ 5", "−3² = 9", "−2 × −3 = −6", "5 × 3 = 15 = 16", "1 m² = 100 cm²", "1 km = 100 m", "3/4 > 4/5", "R$ 5 + R$ 3 = R$ 9", "2^3^2 = 64", "7 ÷ 2 = 3 resto 2", "10 ÷ 3 = 3,334...", "√2 = 1,41", "0,5 = 1/3", "O dobro de 7 é 15", "25% de 80 é 25", "72 km/h = 72 m/s"];
  falsos.forEach((t) => { const y = roda({ tipo: "ideia", titulo: "Veja", linhas: [t] }); ok(!y.v.ok, `texto falso passou: "${t}"`); });
  const verdadeiros = ["2 + 3 × 4 = 14", "0,1 + 0,2 = 0,3", "8 m × 5 m = 40 m²", "1 m² = 10 000 cm²", "π × 5² ≈ 78,5", "7 ÷ 2 = 3 resto 1", "10 ÷ 3 = 3,333...", "2(3 + 1) = 8", "3/4 > 2/3", "72 km/h = 20 m/s", "O dobro de 7 é 14", "2x + 3 = 11", "3 + 4 = 2x + 1"];
  verdadeiros.forEach((t) => { const y = roda({ tipo: "ideia", titulo: "Veja", linhas: [t] }); ok(y.v.ok, `texto verdadeiro foi acusado: "${t}": ${y.v.erros.join(" | ")}`); });
  const formulasErradas = [["Área do triângulo", "A = b × h"], ["Círculo", "A = 2 × π × r"], ["Trapézio", "A = (B + b) × h"], ["Quadrado", "P = l²"], ["Velocidade média", "v = S × t"], ["Circunferência", "C = π × r²"]];
  formulasErradas.forEach(([tit, f]) => { const y = roda({ tipo: "ideia", titulo: tit, linhas: [f] }); ok(!y.v.ok, `fórmula errada passou: ${tit}: ${f}`); });
  const formulasCertas = [["Área do triângulo", "A = b × h ÷ 2"], ["Círculo", "A = π × r²"], ["Trapézio", "A = (B + b) × h ÷ 2"], ["Quadrado", "P = 4 × l"], ["Velocidade média", "v = S ÷ t"], ["Circunferência", "C = 2 × π × r"], ["Retângulo", "A = b × h"]];
  formulasCertas.forEach(([tit, f]) => { const y = roda({ tipo: "ideia", titulo: tit, linhas: [f] }); ok(y.v.ok, `fórmula certa acusada: ${tit}: ${f}: ${y.v.erros.join(" | ")}`); });
  // --- segunda auditoria ---
  x = aprova("* em texto livre é vezes", { tipo: "ideia", titulo: "Veja", linhas: ["Veja: 2*3 = 6", "Área: 8*5 = 40 m²"] }); tem(x, "2 × 3 = 6", "2*3 texto"); naoTem(x, "23 = 6", "2*3 texto"); tem(x, "8 × 5 = 40 m²", "8*5 texto");
  barra("* em texto livre com conta errada", { tipo: "ideia", titulo: "Veja", linhas: ["12*5 = 70"] });
  x = aprova("desafio com 3*4", { tipo: "desafio", enunciado: ["Quanto é 3*4?"], alternativas: ["7", "12", "34", "1"], calculo: "3 × 4" }); naoTem(x, "Quanto é 34", "3*4 enunciado");
  x = aprova("1.000.000 é um milhão", { tipo: "desafio", enunciado: ["1000 × 1000?"], alternativas: ["1.000.000", "100", "10", "10.000"], calculo: "1000 × 1000" }); tem(x, "Alternativa A ✓", "1.000.000");
  barra("500 × 2 não é 1.000.000", { tipo: "desafio", enunciado: ["500 × 2?"], alternativas: ["1.000.000", "100", "10", "10.000"], calculo: "500 × 2" });
  x = aprova("0.125 é decimal", { tipo: "figura", forma: "circulo", medidas: { raio: "0.125" }, unidade: "m" }); tem(x, "r = 0,125 m", "0.125");
  barra("1.875 é ambíguo em conta", { tipo: "movimento", velocidade: "1.875", tempo: "2", unidadeVelocidade: "m/s" });
  barra("'Mais de 40' não é 40", { tipo: "desafio", enunciado: ["5 × 8?"], alternativas: ["Mais de 40", "30", "20", "10"], calculo: "5 × 8" });
  barra("'1½' não é 1", { tipo: "desafio", enunciado: ["0,5 + 0,5?"], alternativas: ["1½", "2", "3", "4"], calculo: "0,5 + 0,5" });
  x = aprova("2x(x + 1) é parábola", { tipo: "grafico", funcao: "y = 2x(x + 1)" }); tem(x, "2º grau", "2x(x+1)");
  x = aprova("fórmula 2x(x + 1)", { tipo: "formula", formula: "A = 2x(x + 1)", valores: { x: "3" } }); tem(x, "A = *24*", "2x(x+1) x=3");
  x = aprova("6 ÷ 2/3 = 9", { tipo: "expressoes", itens: [{ expr: "6 ÷ 2/3" }, { expr: "1/2 ÷ 1/4" }] }); tem(x, "6 ÷ (2/3) = *9*", "6 ÷ 2/3"); tem(x, "(1/2) ÷ (1/4) = *2*", "1/2 ÷ 1/4");
  barra("6 ÷ 2 / 3 com espaço é ambíguo", { tipo: "expressoes", itens: [{ expr: "6 ÷ 2 / 3" }] });
  x = aprova("dízima na alternativa", { tipo: "desafio", enunciado: ["10 ÷ 3?"], alternativas: ["3,33", "3", "30", "0,3"], calculo: "10 ÷ 3" }); tem(x, "Alternativa A ✓", "10 ÷ 3");
  x = aprova("π verdadeiro na alternativa", { tipo: "desafio", enunciado: ["π × 5²?"], alternativas: ["78,54", "31,4", "15,7", "25"], calculo: "π × 5²" }); tem(x, "Alternativa A ✓", "78,54");
  barra("25% não é 25 pessoas", { tipo: "desafio", enunciado: ["100 − 75?"], alternativas: ["25%", "75", "175", "50"], calculo: "100 − 75" });
  const verdadeiros2 = ["2 m + 3 m = 5 m", "1 m² = 1 m × 1 m = 100 cm × 100 cm = 10 000 cm²", "17 ÷ 5 = 3 e resto 2", "17 ÷ 5 = 3, resto 2", "f(2) = 2 × 2 + 1 = 5", "2 h = 2 × 60 min = 120 min", "O dobro de 3 e 5 são 6 e 10", "2/3 ≈ 0,666", "3 ÷ 1/2 = 6", "6 ÷ 2/3 = 9", "1/2 ÷ 1/4 = 2"];
  verdadeiros2.forEach((t) => { const y = roda({ tipo: "ideia", titulo: "Veja", linhas: [t] }); ok(y.v.ok, `texto verdadeiro foi acusado: "${t}": ${y.v.erros.join(" | ")}`); });
  const falsos2 = ["2 m + 3 m = 5 m²", "a) 12 × 3,5 = 40", "1) 2 + 2 = 5", "3 ÷ 1/2 = 1,5", "1/2 ÷ 1/4 = 0,125", "17 ÷ 5 = 3 e resto 3"];
  falsos2.forEach((t) => { const y = roda({ tipo: "ideia", titulo: "Veja", linhas: [t] }); ok(!y.v.ok, `texto falso passou: "${t}"`); });
  // o verificador confere sozinho as linhas de uma equação
  { const y = roda({ tipo: "equacao", equacao: "2x + 3 = 11" }); const suja = JSON.parse(JSON.stringify(y.r.aula));
    suja.passos.forEach((p) => p.acoes.forEach((a) => (a.linhas || []).forEach((l) => { if (l.t === "2x = 8") l.t = "2x = 9"; })));
    ok(!verificarAula(suja).ok, "verificador não pegou passo de equação trocado"); }
  console.log(`  ${falsos.length} frases falsas, ${verdadeiros.length} verdadeiras, ${formulasErradas.length + formulasCertas.length} fórmulas conferidas`);
}

/* 6 — equações aleatórias: todo passo mostrado tem a mesma solução e confere em ponto flutuante */
secao("6) Equações aleatórias (todos os passos conferidos)");
{
  let n = 0;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const nz = () => { let v = 0; while (!v) v = ri(-9, 9); return v; };
  const modelos = [
    () => `${nz()}x + ${ri(0, 20)} = ${ri(-30, 30)}`,
    () => `${nz()}x - ${ri(0, 20)} = ${nz()}x + ${ri(0, 20)}`,
    () => `x/${ri(2, 9)} + ${ri(0, 9)} = ${ri(-9, 9)}`,
    () => `${ri(2, 9)}x/${ri(2, 9)} = ${ri(-20, 20)}`,
    () => `${ri(2, 5)}(x - ${ri(1, 9)}) = ${ri(2, 5)}(x + ${ri(1, 9)}) + ${ri(1, 9)}`,
    () => `x/${ri(2, 6)} - x/${ri(2, 6)} = ${ri(1, 5)}`,
    () => `${ri(1, 9)},${ri(1, 9)}x + ${ri(1, 9)},${ri(1, 9)} = ${ri(1, 20)}`,
    () => `${ri(-20, 20)} = ${nz()}x + ${ri(-9, 9)}`,
  ];
  for (let i = 0; i < 3000; i++) {
    const e = modelos[i % modelos.length]();
    let r;
    try { r = M.resolverEquacao(e); } catch (err) { if (!/infinitas|não tem solução/.test(err.message)) ok(false, `equação "${e}" deu erro: ${err.message}`); continue; }
    n++;
    const flt = (t, xv) => Function("x", `return ${t.replace(/,/g, ".").replace(/(\d)x/g, "$1*x").replace(/(\d)\(/g, "$1*(")}`)(xv);
    const [ea, eb] = e.split("=");
    const sol = M.paraNumero(r.solucao);
    ok(r.ok && Math.abs(flt(ea, sol) - flt(eb, sol)) < 1e-6, `equação "${e}": solução ${sol} não confere`);
    ok(!r.passos.some((p) => /\b0 ?x\b|÷ \d+\/\d+/.test(p.texto)), `equação "${e}": passo com escrita ruim`);
  }
  console.log(`  ${n} equações resolvidas e conferidas passo a passo`);
}

/* 7 — contas exatas x ponto flutuante */
secao("7) Aritmética exata confere com ponto flutuante");
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

/* 8 — toda resposta revelada vem EXPLICADA ("Como chegamos lá") e o cartão nunca perde texto em silêncio */
secao("8) Respostas explicadas e cartões completos");
{
  const base = JSON.parse(fs.readFileSync(path.join(dir, "areas.json"), "utf8"));
  const cartoesOk = (aula) => [aula.inicio, ...aula.passos].flatMap((p) => (p && p.acoes) || []).filter((a) => a.tipo === "cartao" && a.estilo === "ok" && (a.linhas || []).some((l) => l.t === "RESPOSTA"));
  // (a) todos os exemplos que revelam a resposta trazem a explicação, e a conta mostrada confere
  for (const f of exemplos) {
    const plano = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!(plano.blocos || []).some((b) => b.tipo === "revelar")) continue;
    const { aula } = compilarAula(plano, { assinatura: "t" });
    const cs = cartoesOk(aula);
    ok(cs.length === 1, `${f}: o cartão RESPOSTA deveria aparecer uma vez`);
    cs.forEach((c) => {
      const textos = c.linhas.map((l) => l.t);
      ok(textos.includes("COMO CHEGAMOS LÁ"), `${f}: a resposta apareceu sem "Como chegamos lá"`);
      const conta = textos.find((t) => /=/.test(t) && M.conferirTexto(t).conferidas > 0);
      ok(!!conta, `${f}: a explicação não tem uma conta conferível`);
    });
  }
  // (b) frase de motivo com número inventado é descartada e o professor é avisado
  {
    const pl = JSON.parse(JSON.stringify(base));
    pl.abertura.porque = ["O piso tem 8 fileiras de 5 quadrados.", "Sobram 999 quadrados."];
    const r = compilarAula(pl, { assinatura: "t" });
    const textos = cartoesOk(r.aula).flatMap((c) => c.linhas.map((l) => l.t));
    ok(textos.some((t) => /8 fileiras/.test(t)), "frase boa do motivo sumiu");
    ok(!textos.some((t) => /999/.test(t)), "frase com número inventado entrou na aula");
    ok(r.relatorio.avisos.some((a) => /descartadas/.test(a)), "professor não foi avisado da frase descartada");
  }
  // (c) resposta sem cálculo e sem motivo: o professor precisa conferir (dúvida)
  {
    const pl = JSON.parse(JSON.stringify(base));
    delete pl.abertura.calculo; delete pl.abertura.porque;
    const r = compilarAula(pl, { assinatura: "t" });
    ok(r.relatorio.duvidas.some((d) => /sem explicação/.test(d)), "resposta sem explicação não gerou dúvida para o professor");
  }
  // (d) texto de cartão grande demais: avisa em vez de cortar em silêncio
  {
    const pl = JSON.parse(JSON.stringify(base));
    pl.termos[0].oQueE = ["Primeira frase bem comprida do cartão aqui.", "Segunda frase bem comprida do cartão aqui.", "Terceira frase bem comprida do cartão aqui."];
    const r = compilarAula(pl, { assinatura: "t" });
    ok(r.relatorio.duvidas.some((d) => /cortado/.test(d)), "texto cortado do cartão não gerou dúvida");
  }
  // (f) cartão de palavra criado pela IA (complemento) vira dúvida para o professor
  {
    const pl = JSON.parse(JSON.stringify(base));
    pl.termos[0].complemento = true;
    const r = compilarAula(pl, { assinatura: "t" });
    ok(r.relatorio.duvidas.some((d) => /texto criado pela IA/.test(d)), "termo complemento não gerou dúvida");
    const r2 = compilarAula(base, { assinatura: "t" });
    ok(!r2.relatorio.duvidas.some((d) => /texto criado pela IA/.test(d)), "termo do material gerou dúvida à toa");
  }
  // (g) várias rodadas de exercícios não repetem a mesma legenda
  {
    const pl = JSON.parse(JSON.stringify(base));
    const ex = pl.blocos.find((b) => b.tipo === "expressoes");
    const sem = (b) => { const c = JSON.parse(JSON.stringify(b)); delete c.legenda; delete c.legenda2; return c; };
    pl.blocos = pl.blocos.filter((b) => b.tipo !== "expressoes");
    const pos = pl.blocos.findIndex((b) => b.tipo === "desafio");
    pl.blocos.splice(pos, 0, sem(ex), sem(ex), sem(ex));
    const r = compilarAula(pl, { assinatura: "t" });
    const legs = r.aula.passos.flatMap((p) => p.acoes).filter((a) => a.tipo === "legenda").map((a) => a.t);
    const rodadas = legs.filter((t) => /caderno|conferir|conferimos|respostas/i.test(t));
    ok(new Set(rodadas).size === rodadas.length, `legendas repetidas nas rodadas: ${rodadas.join(" | ")}`);
  }
  // (e) aleatório: a conta do cartão sempre bate com o cálculo (multiplicação e divisão, com decimais)
  {
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const a = Math.floor(rnd() * 90 + 2), b = pick([2, 4, 5, 0.25, 0.5, 1.5, 2.5, 10]);
      const mult = rnd() < 0.5;
      const bs = String(b).replace(".", ",");
      const calculo = mult ? `${a} × ${bs}` : `${a} ÷ ${bs}`;
      const v = M.paraNumero(M.avaliar(calculo));
      const alts = [v, v + 1, v + 2, v + 3].map((x) => `${String(Math.round(x * 1000) / 1000).replace(".", ",")} un`);
      const pl = JSON.parse(JSON.stringify(base));
      pl.abertura = { antes: "Conta do dia", destaque: calculo, depois: "quanto dá?", alternativas: alts, correta: 0, calculo, porque: [`Usamos ${a} e ${bs}.`] };
      const r = compilarAula(pl, { assinatura: "t" });
      if (r.relatorio.erros.length) { ok(false, `abertura "${calculo}" deu erro: ${r.relatorio.erros.join(" | ")}`); continue; }
      const vv = verificarAula(r.aula);
      ok(vv.ok, `abertura "${calculo}" reprovada pelo verificador: ${vv.erros.join(" | ")}`);
      const linhas = cartoesOk(r.aula).flatMap((c) => c.linhas.map((l) => l.t));
      ok(linhas.some((t) => t.startsWith(M.escreverConta(calculo) + " =") || t.startsWith(M.escreverConta(calculo) + " ≈")), `abertura "${calculo}": a conta não apareceu no cartão`);
      n++;
    }
    console.log(`  ${n} aberturas aleatórias com a conta explicada e conferida`);
  }
}

console.log(`\n${total - falhas}/${total} verificações passaram${falhas ? " — " + falhas + " FALHARAM" : ""}`);
process.exit(falhas ? 1 : 0);
