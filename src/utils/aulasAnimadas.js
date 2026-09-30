// Aulas animadas (quadro passo a passo) para as disciplinas de exatas.
// Cada aula animada é uma página pronta em public/aulas-animadas/<id>.html.
// No painel, o professor escolhe qual aula animada vai junto com a aula;
// o aluno abre pelo botão "Aula animada" na página da turma.
//
// O roteiro da lousa é só do professor (igual ao Registro da Aula):
// aparece no painel, nunca na página do aluno.

const sem = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Só as turmas de exatas mostram os campos novos no painel.
// Assim, o formulário de História e do técnico continua exatamente igual.
export function ehDisciplinaDeExatas(disciplina) {
  const d = sem(disciplina);
  return d.includes("matematica") || d.includes("fisica");
}

export const AULAS_ANIMADAS = [
  {
    id: "medindo-superficies",
    titulo: "Medindo superfícies — km², hectare e cm² (2ª série · 4º bim · Aula 1)",
    roteiroLousa: `MEDINDO SUPERFÍCIES — 2ª série · 4º bim · Aula 1      Data: __/__

1) ÁREA: medida do tamanho de uma superfície.
   Medimos contando quantos quadrados de tamanho conhecido cabem nela.

2) UNIDADES DE ÁREA
   1 m²  = quadrado de 1 m de lado
   1 km² = quadrado de 1 km de lado        (1 km = 1 000 m)
   1 ha  = quadrado de 100 m de lado
   1 ha  = 100 m × 100 m = 10 000 m²

3) RELAÇÕES
   1 km² = 1 000 m × 1 000 m = 1 000 000 m²
   1 km = 10 × 100 m  →  1 km² = 10 × 10 = 100 ha
   Confere: 100 × 10 000 m² = 1 000 000 m² ✓

   km² → ha: × 100        ha → km²: ÷ 100
   (×100: a vírgula anda 2 casas para a direita)

4) EXEMPLO — Igarapava: 468,2 km² = ? ha
   468,2 × 100 = 46 820 ha

5) EXERCÍCIOS (caderno)
   a) Jundiaí: 431,2 km² = ? ha
   b) A área plantada de SP passou de 2,62 para 2,66 milhões de ha.
      Qual foi o aumento em ha, em km² e em m²?

GABARITO (só para o professor)
   a) 431,2 × 100 = 43 120 ha
   b) 2,66 − 2,62 = 0,04 milhão de ha = 40 000 ha
      40 000 ÷ 100 = 400 km²
      40 000 × 10 000 = 400 000 000 m²
   Desafio UNICAMP 2021 (slide 18): 5 × 5 + 0,5 × 0,5 = 25 + 0,25 = 25,25 cm²
      → está entre 25 cm² e 27 cm² (alternativa C). Não é a D: 25,25 é maior que 25.`,
  },
];

export function acharAulaAnimada(id) {
  return AULAS_ANIMADAS.find((a) => a.id === id) || null;
}

// O tema de cores vem do número da aula: aula 1 → tema 1 ... aula 30 → tema 30,
// aula 31 → tema 1 de novo. Assim, nunca repete antes da 31ª aula.
export function linkAulaAnimada(id, numeroAula) {
  const n = parseInt(String(numeroAula || "").replace(/\D/g, ""), 10);
  const tema = Number.isFinite(n) && n > 0 ? ((n - 1) % 30) + 1 : 1;
  return `/aulas-animadas/${id}.html#tema${tema}`;
}
