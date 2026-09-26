// Ajudantes do "Preencher aula com IA". Nada aqui grava dados.
import { lerModulo, ordenarModulos } from "./bimestres.js";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Ex.: 26/09/2026 -> "4ª semana de setembro de 2026" (dias 1-7 = 1ª, 8-14 = 2ª, ...)
export function semanaDeReferencia(data = new Date()) {
  const n = Math.ceil(data.getDate() / 7);
  return `${n}ª semana de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

function anoDoModulo(modulos, moduloId) {
  const novo = String(moduloId || "").match(/^novo:(\d{4}):\d$/);
  if (novo) return Number(novo[1]);
  const m = (modulos || []).find((x) => x.id === moduloId);
  return m ? lerModulo(m).ano : new Date().getFullYear();
}

// Numero da aula quando o material nao traz: o maior numero ja usado no mesmo ano + 1.
export function proximoNumeroAula(modulos, moduloId) {
  const ano = anoDoModulo(modulos, moduloId);
  let maior = 0;
  (modulos || [])
    .filter((m) => lerModulo(m).ano === ano)
    .forEach((m) =>
      (m.aulas || []).forEach((a) => {
        const r = String(a.numeroAula || "").match(/aula\s*(\d+)/i) || String(a.numeroAula || "").match(/^\s*(\d+)/);
        if (r) maior = Math.max(maior, Number(r[1]));
      })
    );
  return maior + 1;
}

// As ultimas aulas publicadas na turma, para a IA copiar o formato e o tom do professor.
export function exemplosDaTurma(turma, quantidade = 3) {
  const aulas = [];
  ordenarModulos(turma?.modulos).forEach((m) => (m.aulas || []).forEach((a) => aulas.push(a)));
  return aulas
    .filter((a) => a.titulo && a.introducao)
    .slice(-quantidade)
    .map((a) => ({ numeroAula: a.numeroAula || "", titulo: a.titulo, introducao: a.introducao, utilidade: a.utilidade || "" }));
}
