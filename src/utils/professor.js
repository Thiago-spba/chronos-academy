// Quem assina o material de estudo. Fixo (nao vem da IA), escolhido pela
// disciplina da turma, para nunca aparecer a formacao errada numa aula.
export const NOME_PROFESSOR = "Prof. Thiago Fernando";

const sem = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const REGRAS = [
  { chaves: ["historia"], formacao: "Licenciado em História" },
  { chaves: ["matematica"], formacao: "Licenciado em Matemática" },
  {
    chaves: ["desenvolvimento", "sistemas", "programacao", "computacao", "informatica", "tecnologia", "logica", "redes", "software", "dados"],
    formacao: "Engenheiro da Computação",
  },
];

const FORMACAO_PADRAO = "Pós-graduado em Metodologia da Educação";

export function credencialProfessor(disciplina) {
  const d = sem(disciplina);
  const regra = REGRAS.find((r) => r.chaves.some((c) => d.includes(c)));
  return { nome: NOME_PROFESSOR, formacao: regra ? regra.formacao : FORMACAO_PADRAO };
}
