// Aulas animadas geradas pela IA e guardadas na nuvem (chronos/animada_<idDaAula>).
// O JSON da aula vai como texto (o Firestore nao aceita listas dentro de listas).
import { hashTexto } from "./temasMaterial";

export const docIdAnimada = (aulaId) => `animada_${aulaId}`;

export function empacotarAula({ aula, plano, tema, aulaId, titulo }) {
  return {
    aulaId,
    titulo: titulo || aula?.titulo || "",
    tema: Number(tema) || 1,
    aulaJson: JSON.stringify(aula),
    planoJson: JSON.stringify(plano || null),
    atualizadoEm: new Date().toISOString(),
  };
}

export function desempacotarAula(dados) {
  if (!dados || typeof dados.aulaJson !== "string") return null;
  try {
    return {
      aula: JSON.parse(dados.aulaJson),
      plano: dados.planoJson ? JSON.parse(dados.planoJson) : null,
      tema: Number(dados.tema) || 1,
      titulo: dados.titulo || "",
    };
  } catch {
    return null;
  }
}

// Tema (1 a 30) pela ordem da aula na turma: nunca repete antes da 31a aula.
// O "embaralho" pelo codigo da turma faz turmas diferentes comecarem em temas diferentes.
export function temaPelaOrdem(turmaId, ordem) {
  return ((Number(ordem) || 0) + hashTexto(turmaId)) % 30 + 1;
}

// Temas (1 a 30) que a turma ja usou em aulas animadas, para nunca repetir antes da 31a aula.
// Aula pronta do site: tema = numero da aula (mesma regra do link antigo). Aula gerada: tema guardado nela.
export function temasUsados(turma, exceto) {
  const usados = new Set();
  (turma?.modulos || []).forEach((m) => (m.aulas || []).forEach((a) => {
    if (a.id === exceto) return;
    if (a.aulaGerada && Number(a.temaAnimada) >= 1) usados.add(Number(a.temaAnimada));
    else if (a.aulaAnimada) {
      const n = parseInt((String(a.numeroAula || "").match(/\d+/) || [])[0], 10);
      if (Number.isFinite(n) && n > 0) usados.add(((n - 1) % 30) + 1);
    }
  }));
  return usados;
}

// Primeiro tema livre a partir do ponto de partida da turma (e a partir do tema "depois").
export function escolherTema(turma, turmaId, exceto, depois) {
  const usados = temasUsados(turma, exceto);
  const inicio = depois ? (depois % 30) + 1 : temaPelaOrdem(turmaId, contarAulasAnimadas(turma, exceto));
  for (let i = 0; i < 30; i++) {
    const t = ((inicio - 1 + i) % 30) + 1;
    if (!usados.has(t) && t !== depois) return t;
  }
  return inicio; // as 30 ja foram usadas: recomeca o ciclo
}

// Quantas aulas animadas (prontas ou geradas) a turma ja tem, sem contar a aula "exceto".
export function contarAulasAnimadas(turma, exceto) {
  let n = 0;
  (turma?.modulos || []).forEach((m) => (m.aulas || []).forEach((a) => {
    if (a.id !== exceto && (a.aulaGerada || a.aulaAnimada)) n++;
  }));
  return n;
}
