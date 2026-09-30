// Verificador independente de aulas animadas (Etapa 2).
// Recebe a aula JÁ COMPILADA (JSON do motor) e confere, sem confiar no compilador nem na IA:
//  1) estrutura: peças conhecidas, campos obrigatórios, ids que existem, termos que existem;
//  2) matemática: recalcula contas/colunas/vírgulas e confere toda frase "A op B = C";
//  3) pergunta/alternativas: 4 opções, única correta válida.
// Não grava nada. Devolve { ok, erros, avisos, verificadas }.
import { lerNumero, vezes, dividido, soma, menos, igual, conferirTexto, avaliar, avaliarLinear, acharAlternativa, formatar, usaPi, ehZero } from "./matematicaExata.js";
import { conferirFormulas, contextosDeFormula } from "./formulasConhecidas.js";

const PECAS = [
  "sai", "mover", "pulsar", "mostrar", "tracar", "legenda", "termo", "guardar", "pergunta", "faixa",
  "linhas", "cartao", "contagem", "quadrado", "figura", "reta", "alternativas", "assinatura",
  "conta", "virgula", "coluna",
];
// peças que criam um objeto (id) que outras peças podem usar depois
const CRIAM = ["pergunta", "faixa", "linhas", "cartao", "contagem", "quadrado", "figura", "reta", "alternativas", "conta", "virgula", "coluna"];
const MAX_PASSOS = 60;
const MAX_LEGENDA = 170;
const MAX_LINHA = 64;

function todasAsStrings(x, saida = []) {
  if (typeof x === "string") saida.push(x);
  else if (Array.isArray(x)) x.forEach((v) => todasAsStrings(v, saida));
  else if (x && typeof x === "object") Object.values(x).forEach((v) => todasAsStrings(v, saida));
  return saida;
}

function num(txt) {
  try { return lerNumero(txt); } catch { return null; }
}

function verificar(aula) {
  const erros = [];
  const avisos = [];
  let verificadas = 0;
  const err = (m) => erros.push(m);
  const avi = (m) => avisos.push(m);

  if (!aula || typeof aula !== "object") return { ok: false, erros: ["Aula vazia."], avisos, verificadas };
  if (!aula.titulo || typeof aula.titulo !== "string") err("A aula não tem título.");
  if (!Array.isArray(aula.passos) || aula.passos.length === 0) return { ok: false, erros: [...erros, "A aula não tem passos."], avisos, verificadas };
  if (aula.passos.length > MAX_PASSOS) err("Passos demais (" + aula.passos.length + "; máximo " + MAX_PASSOS + ").");
  const termos = aula.termos && typeof aula.termos === "object" ? aula.termos : {};

  const existentes = new Set();
  const registra = (a) => {
    if (!CRIAM.includes(a.tipo)) return;
    if (a.tipo !== "linhas" && a.tipo !== "cartao" && a.tipo !== "faixa") existentes.add(a.id || a.tipo); // o motor usa o nome da peça se não houver id
    else if (a.id) existentes.add(a.id);
    (Array.isArray(a.linhas) ? a.linhas : []).forEach((l) => { if (l && l.id) existentes.add(l.id); });
    (Array.isArray(a.formas) ? a.formas : []).forEach((f) => { if (f && f.id) existentes.add(f.id); });
    if (a.tipo === "quadrado") existentes.add(a.idContador || "contador");
  };

  const conferirAcao = (a, onde) => {
    if (!a || typeof a !== "object") { err(onde + ": ação inválida."); return; }
    if (!PECAS.includes(a.tipo)) { err(onde + ": peça desconhecida \"" + a.tipo + "\"."); return; }

    // referências
    if (["mostrar", "mover", "pulsar", "tracar"].includes(a.tipo)) {
      if (!a.alvo || !existentes.has(a.alvo)) err(onde + ": " + a.tipo + " aponta para \"" + a.alvo + "\", que ainda não existe.");
    }
    if (a.tipo === "sai") {
      if (!Array.isArray(a.alvos) || !a.alvos.length) err(onde + ": \"sai\" sem alvos.");
      else a.alvos.forEach((id) => { if (!existentes.has(id)) err(onde + ": \"sai\" aponta para \"" + id + "\", que não existe."); });
    }
    if (a.tipo === "termo" || a.tipo === "guardar") {
      if (!a.chave || !termos[a.chave]) err(onde + ": termo \"" + a.chave + "\" não está definido.");
    }

    // pergunta
    if (a.tipo === "pergunta") {
      const alts = a.alternativas || [];
      if (alts.length !== 4) err(onde + ": a pergunta precisa de 4 alternativas (tem " + alts.length + ").");
      if (!/^[0-3]$/.test(String(a.correta))) err(onde + ": \"correta\" deve ser 0 a 3.");
      if (new Set(alts.map((t) => String(t).trim())).size !== alts.length) err(onde + ": alternativas repetidas na pergunta.");
      for (const k of ["antes", "destaque", "depois"]) if (!a[k]) err(onde + ": pergunta sem \"" + k + "\".");
    }
    if (a.tipo === "alternativas") {
      const it = a.itens || [];
      if (it.length !== 4) err(onde + ": alternativas precisam de 4 itens (tem " + it.length + ").");
      if (new Set(it.map((x) => String(x[1]).trim())).size !== it.length) err(onde + ": itens repetidos nas alternativas.");
    }

    // contas
    if (a.tipo === "conta" && a.fase === "entrar") {
      const n = num(a.numero), f = num(a.fator);
      if (!n || !f) err(onde + ": conta com número inválido (" + a.numero + ", " + a.fator + ").");
      else {
        const r = a.op === "div" ? dividido(n, f) : vezes(n, f);
        if (a.resultado != null) {
          const dado = num(a.resultado);
          if (!dado || !igual(dado, r)) err(onde + ": " + a.numero + (a.op === "div" ? " ÷ " : " × ") + a.fator + " não dá " + a.resultado + ".");
          else verificadas++;
        } else verificadas++;
      }
    }
    if (a.tipo === "virgula") {
      const n = num(a.numero);
      if (!n) err(onde + ": vírgula com número inválido (" + a.numero + ").");
      else {
        let p = 1n; for (let i = 0; i < Number(a.casas); i++) p *= 10n;
        const r = vezes(n, { n: p, d: 1n });
        if (a.resultado != null) {
          const dado = num(a.resultado);
          if (!dado || !igual(dado, r)) err(onde + ": " + a.numero + " × 10^" + a.casas + " não dá " + a.resultado + ".");
          else verificadas++;
        } else verificadas++;
      }
    }
    if (a.tipo === "coluna" || a.tipo === "conta" || a.tipo === "virgula") {
      // o motor desenha os algarismos sem sinal e só entende vírgula decimal
      [a.a, a.b, a.numero, a.fator, a.resultado].forEach((v) => {
        if (v != null && /[-−.]/.test(String(v))) err(onde + ": número \"" + v + "\" com sinal ou ponto não pode ir para a conta armada.");
      });
    }
    if (a.tipo === "coluna") {
      const A = num(a.a), B = num(a.b);
      if (!A || !B) err(onde + ": coluna com número inválido (" + a.a + ", " + a.b + ").");
      else {
        const r = a.op === "add" ? soma(A, B) : menos(A, B);
        if (r.n < 0n) err(onde + ": a coluna daria resultado negativo.");
        else if (a.resultado != null) {
          const dado = num(a.resultado);
          if (!dado || !igual(dado, r)) err(onde + ": " + a.a + (a.op === "add" ? " + " : " − ") + a.b + " não dá " + a.resultado + ".");
          else verificadas++;
        } else verificadas++;
      }
    }

    // textos: tamanho e contas escritas
    if (a.tipo === "legenda" && String(a.t || "").length > MAX_LEGENDA) avi(onde + ": legenda muito longa (" + a.t.length + " letras).");
    (Array.isArray(a.linhas) ? a.linhas : []).forEach((l) => {
      if (l && typeof l.t === "string" && l.t.length > MAX_LINHA) avi(onde + ": linha longa (\"" + l.t.slice(0, 30) + "…\").");
    });
    if (a.tipo === "figura") {
      (Array.isArray(a.formas) ? a.formas : []).forEach((f) => {
        if (!f || typeof f !== "object") return;
        const ns = [f.x, f.y, f.w, f.h, f.x1, f.y1, f.x2, f.y2, f.raio];
        if (ns.some((v) => v != null && !Number.isFinite(v))) err(onde + ": figura com medida inválida.");
        (f.pontos || []).forEach((pt) => { if (!Array.isArray(pt) || !pt.every(Number.isFinite)) err(onde + ": figura com ponto inválido."); });
      });
    }
    // pergunta/desafio: o cálculo guardado precisa dar o valor da alternativa marcada
    if (a.conferencia && a.conferencia.calculo) {
      try {
        const v = avaliar(a.conferencia.calculo);
        const fino = usaPi(a.conferencia.calculo) ? avaliar(a.conferencia.calculo, { vars: { pi: "3,14159265358979323846" } }) : null;
        const opc = { fino, porcento: /%|×\s*100\s*$/.test(a.conferencia.calculo) };
        const alts = a.tipo === "pergunta" ? (a.alternativas || []) : [a.conferencia.alternativa];
        const idx = a.tipo === "pergunta" ? Number(a.correta) : 0;
        const r = acharAlternativa(alts, v, opc);
        if (a.tipo === "pergunta" && r.indice !== idx && !(r.indice == null && r.motivo === "ilegivel")) err(onde + ": a alternativa marcada não é a que tem o valor de " + a.conferencia.calculo + " (" + formatar(v) + ").");
        else if (a.tipo !== "pergunta" && r.indice !== 0 && r.motivo !== "ilegivel") err(onde + ": a alternativa revelada não tem o valor de " + a.conferencia.calculo + " (" + formatar(v) + ").");
        else verificadas++;
      } catch (e) { err(onde + ": não consegui recalcular a conferência (" + e.message + ")."); }
    }
    // quadros com "A = 8 × 6" seguido de "A = 48": o valor precisa bater
    if (a.tipo === "linhas" && Array.isArray(a.linhas)) {
      const ls = a.linhas.map((l) => String((l && l.t) || "").replace(/\*/g, ""));
      const re = /^\s*([\p{L}Δ])\s*([=≈])\s*(.+)$/u;
      for (let i = 0; i < ls.length; i++) {
        const mi = re.exec(ls[i]);
        if (!mi || !/\d/.test(mi[3]) || !/[×÷+\-−^²³]/.test(mi[3]) || /[\p{L}]/u.test(mi[3].replace(/π/g, ""))) continue;
        for (let j = i + 1; j < Math.min(ls.length, i + 3); j++) {
          const mj = re.exec(ls[j]);
          if (!mj || mj[1] !== mi[1]) continue;
          const c = conferirTexto(mi[3] + " " + mj[2] + " " + mj[3]);
          verificadas += c.conferidas;
          c.erros.forEach((e) => err(onde + ": \"" + ls[i] + "\" e \"" + ls[j] + "\" não batem (" + e.esperado + ")."));
          break;
        }
      }
    }
    registra(a);
  };

  // início (pergunta de abertura)
  if (aula.inicio) {
    (aula.inicio.acoes || []).forEach((a, i) => conferirAcao(a, "Abertura, ação " + (i + 1)));
    if (aula.inicio.legenda && aula.inicio.legenda.length > MAX_LEGENDA) avi("Abertura: legenda longa.");
  }
  aula.passos.forEach((p, i) => {
    const onde = "Passo " + (i + 1);
    if (!p || !Array.isArray(p.acoes) || !p.acoes.length) { err(onde + ": passo sem ações."); return; }
    if (!(p.momento >= 0 && p.momento <= 4)) err(onde + ": momento inválido.");
    if (!p.acoes.some((a) => a && a.tipo === "legenda")) avi(onde + ": passo sem legenda (o aluno fica sem explicação escrita).");
    p.acoes.forEach((a, j) => conferirAcao(a, onde + (p.acoes.length > 1 ? ", ação " + (j + 1) : "")));
    // a legenda não pode dizer um valor diferente do quadro ("S = 87 m" na legenda e "S = 80 m" no quadro)
    const bare = /(?:^|[^\p{L}])([\p{L}Δ])\s*=\s*\*?(−?-?\d{1,3}(?: \d{3})*(?:,\d+)?|−?-?\d+(?:,\d+)?)\*?(?![\d,]|\s*[×÷+\-−*\/^])/gu;
    const doQuadro = {};
    p.acoes.filter((a) => a && a.tipo === "linhas").forEach((a) => (a.linhas || []).forEach((l) => {
      for (const m of String((l && l.t) || "").matchAll(bare)) (doQuadro[m[1]] = doQuadro[m[1]] || new Set()).add(m[2].replace(/−/g, "-"));
    }));
    p.acoes.filter((a) => a && a.tipo === "legenda").forEach((a) => {
      for (const m of String(a.t || "").matchAll(bare)) {
        const q = doQuadro[m[1]];
        if (q && q.size === 1 && !q.has(m[2].replace(/−/g, "-"))) err(onde + ": a legenda diz " + m[1] + " = " + m[2] + ", mas o quadro mostra " + m[1] + " = " + [...q][0] + ".");
      }
    });
  });

  // toda frase com "A op B = C" da aula inteira
  const c = conferirTexto_todas(aula);
  verificadas += c.conferidas;
  c.erros.forEach((e) => err("Conta escrita errada: \"" + e.trecho + "\" — o certo seria " + e.esperado + "."));

  // resoluções de equação (quadros "eqN_i"): toda linha "… = …" com a incógnita tem a MESMA solução
  const eqs = {};
  aula.passos.forEach((p) => (p && p.acoes || []).forEach((a) => {
    const m = a && a.tipo === "linhas" && /^(eq\d+)_\d+$/.exec(String(a.id || ""));
    if (m) (a.linhas || []).forEach((l) => { (eqs[m[1]] = eqs[m[1]] || []).push(String((l && l.t) || "")); });
  }));
  Object.entries(eqs).forEach(([id, linhas]) => {
    let sol = null, letra = null;
    linhas.forEach((t0) => {
      const t = t0.replace(/\*/g, "").replace(/\s*≈.*$/, "");
      if (/^Conferindo/.test(t) || (t.match(/=/g) || []).length !== 1) return;
      const ls = [...new Set(t.match(/\p{L}/gu) || [])];
      if (ls.length !== 1) return;
      try {
        const [e, d] = t.split("=");
        const L = avaliarLinear(e, { incognita: ls[0], implicita: true }), R = avaliarLinear(d, { incognita: ls[0], implicita: true });
        const A = menos(L.a, R.a);
        if (ehZero(A)) { err("Equação " + id + ": a linha \"" + t + "\" não tem solução única."); return; }
        const x = dividido(menos(R.b, L.b), A);
        verificadas++;
        if (sol == null) { sol = x; letra = ls[0]; }
        else if (ls[0] !== letra || !igual(sol, x)) err("Equação " + id + ": a linha \"" + t + "\" não tem a mesma solução das outras (" + letra + " = " + formatar(sol) + ").");
      } catch { /* linha que não é equação */ }
    });
  });

  // fórmulas escritas em textos (ex.: "triângulo: A = b × h" está errado)
  const grupos = [];
  const juntar = (x) => todasAsStrings(x);
  (aula.inicio && aula.inicio.acoes || []).forEach((a) => grupos.push(juntar(a)));
  aula.passos.forEach((p) => (p && p.acoes || []).forEach((a) => grupos.push(juntar(a))));
  Object.values(termos).forEach((t) => grupos.push(juntar(t)));
  const vistosF = new Set();
  grupos.forEach((strs) => {
    const ctxGrupo = contextosDeFormula(strs.join(" "));
    strs.forEach((t) => conferirFormulas(t, ctxGrupo).forEach((e) => { if (!vistosF.has(e)) { vistosF.add(e); err(e); } }));
  });

  return { ok: erros.length === 0, erros, avisos, verificadas };
}

function conferirTexto_todas(aula) {
  let conferidas = 0;
  const erros = [];
  const vistos = new Set();
  todasAsStrings(aula).forEach((s) => {
    if (!/[=≈<>≤≥]|(^|\s)(é|vale|dá)(\s|$)/.test(s)) return;
    const r = conferirTexto(s);
    conferidas += r.conferidas;
    r.erros.forEach((e) => { const k = e.trecho + "|" + e.esperado; if (!vistos.has(k)) { vistos.add(k); erros.push(e); } });
  });
  return { conferidas, erros };
}

export function verificarAula(aula) {
  try {
    return verificar(aula);
  } catch (e) {
    return { ok: false, erros: ["O verificador não conseguiu ler a aula: " + (e && e.message)], avisos: [], verificadas: 0 };
  }
}
