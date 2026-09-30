// "Aula animada com IA": le o material (PDFs e/ou texto colado) e devolve um PLANO da aula.
// A IA NAO desenha e NAO calcula: o plano e compilado no proprio servidor (compiladorAula.js),
// que faz todas as contas com aritmetica exata, e depois conferido por outro codigo
// independente (verificadorAula.js). O professor revisa tudo antes de publicar.
// Seguranca: so o professor (e-mail conferido no servidor) pode usar.

import { compilarAula, normalizarPlano } from "../src/utils/compiladorAula.js";
import { verificarAula } from "../src/utils/verificadorAula.js";
import { verificarToken, coletarPdfs, texto, MAX_TEXTO } from "./_comum.js";

const MODEL = "claude-haiku-4-5-20251001";
const ASSINATURA_PADRAO = "Aula elaborada por Thiago Fernando, professor, graduando em Engenharia da Computação, licenciado em Matemática.";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

const CATALOGO = `BLOCOS QUE VOCE PODE USAR (campo "tipo"). Os blocos devem vir em ordem: ver, montar, suavez, fechamento (nunca volte a um momento anterior). Cada bloco tem "momento": "ver" (mostrar a ideia), "montar" (construir/explicar passo a passo), "suavez" (exercicios da turma), "fechamento". Todo bloco pode ter "legenda" (frase curta, ate 90 letras, dita ao aluno; *palavra* entre asteriscos = destaque), "fonte" (onde no material isto aparece, ex.: "pag. 3, exemplo 2") e "complemento": true se a informacao NAO esta no material.
- "ideia": {titulo, linhas:[ate 5 linhas curtas], destaque} -> cartao de texto explicativo.
- "termo": {chave} -> abre o cartao de um termo definido em "termos" (a chave precisa existir la).
- "faixa": {antes, numero, depois} -> faixa do problema no alto (ex.: antes "Problema: piso de", numero "8 m × 5 m", depois "→ qual a área?").
- "conta": {numero, op:"mul"|"div", fator:"10"|"100"|"1000"|..., unidadeDe, unidadePara, nota:[ate 2 frases de NO MAXIMO 22 letras cada, ex.: "cada zero = 1 casa"], legenda2} -> a virgula anda ao multiplicar/dividir por potencia de 10 (conversao de unidades, decimais). NAO informe o resultado.
- "coluna": {op:"add"|"sub", a, b, titulo, unidade, notas:[ate 3]} -> conta armada (soma/subtracao com virgulas alinhadas). NAO informe o resultado.
- "expressoes": {titulo, itens:[{rotulo:"a)", expr:"12 × 3,5", unidade, nota}], passoAPasso} -> exercicios; use apenas numeros, + − × ÷ e parenteses. O sistema calcula as respostas.
- "formula": {nome, formula:"A = b × h", valores:{b:"7,5",h:"4"}, unidades:{A:"cm²",b:"cm",h:"cm"}, variaveis:{b:"base",h:"altura"}} -> mostra a formula, troca as letras pelos valores e calcula. NAO informe o resultado.
- "figura": {forma:"retangulo"|"quadrado"|"paralelogramo"|"triangulo"|"trapezio", medidas:{base,altura | lado | baseMaior,baseMenor,altura}, unidade:"cm", legendas:[ate 3]} -> desenha e anima a figura com a area.
- "equacao": {titulo, equacao:"5x = 40"} -> resolve passo a passo (equacao do 1º grau com uma incognita).
- "desafio": {enunciado:[ate 4 linhas], alternativas:[4 opcoes], calculo:"25 × 12", unidade:"m²", correta:0-3} -> pergunta de multipla escolha; o sistema acha a alternativa certa pelo "calculo". Os erros (distratores) devem ser erros tipicos dos alunos.
- "revelar": {} -> revela a resposta da pergunta de abertura (use logo depois da figura/conta que a responde).
- "fecho": {titulo:"REGRA DE HOJE", regra:[ate 5 linhas], pegaTitulo:"CUIDADO: PEGADINHA", pega:[ate 4 linhas]} -> dois cartoes finais.`;

const REGRAS = `REGRAS OBRIGATORIAS:
1. Use SOMENTE o que esta no material. Numeros, formulas, exemplos e definicoes devem vir do material. Se precisar de algo de fora (um exemplo seu, uma definicao a mais), marque "complemento": true naquele bloco.
2. NUNCA escreva o resultado de uma conta. Voce so informa os numeros e as operacoes; o sistema calcula. Nao escreva "= 40" em legendas ou linhas: se citar um resultado, ele sera conferido e, se estiver errado, sua aula sera recusada.
3. Se algo no material estiver confuso, contraditorio, incompleto, ou se voce nao tem certeza do que o professor quer, NAO chute: escreva a pergunta em "duvidas" (lista de frases curtas e diretas). Se o material tiver erro, registre em "avisos".
4. Nunca repita a mesma ideia em dois blocos. A aula deve ter de 8 a 16 blocos e caminhar de simples para dificil: abertura (pergunta de votacao) -> ver -> montar -> sua vez -> fecho.
5. Linguagem simples, curta, para o aluno. Frases de ate 90 letras. Use o nivel indicado (Fundamental II ou Ensino Medio).
6. Numeros no formato brasileiro: virgula nos decimais (3,5) e espaco nos milhares (1 000).
7. Use apenas os tipos de bloco do catalogo. Se o assunto pedir algo que o catalogo nao tem (ex.: grafico de funcao, fracoes desenhadas), use "ideia" para explicar em texto e escreva em "duvidas" que essa parte ficou sem animacao.
8. Toda palavra listada em "termos" precisa ter um bloco "termo" que a apresente (antes de usa-la); nao liste palavras que nao serao apresentadas.
9. Use o bloco "revelar" UMA unica vez, logo depois do bloco (figura, formula, conta, expressoes) que responde a pergunta de abertura.
10. Todo bloco, exceto "fecho", deve trazer uma "legenda" curta que explique ao aluno o que esta acontecendo.
11. Em "expressoes", o sistema mostra primeiro as contas com "= ?" e depois as respostas: nao escreva as respostas.
12. A abertura e uma pergunta curta com 4 alternativas cuja resposta sera descoberta durante a aula. Informe "calculo" quando a resposta for numerica (o sistema decide a alternativa certa).`;

const FORMATO = `Responda SOMENTE com um JSON (sem texto antes ou depois) neste formato:
{
  "titulo": "titulo da aula (ate 44 letras)",
  "termos": [ {"chave":"area","chip":"Área","titulo":"ÁREA","oQueE":["ate 3 linhas","de ate 33 letras"],"explicando":["..."],"exemplo":["..."]} ],   // de 1 a 4 palavras-chave da aula
  "abertura": {"antes":"frase de contexto","destaque":"o numero/expressao em foco (ate 24 letras)","depois":"a pergunta","alternativas":["A","B","C","D"],"correta":2,"calculo":"8 × 5"},
  "blocos": [ ... ],
  "duvidas": [ ... ],
  "avisos": [ ... ]
}`;

const EXEMPLO = `EXEMPLO de plano (aula sobre area):
{"titulo":"Áreas de figuras planas","termos":[{"chave":"area","chip":"Área","titulo":"ÁREA","oQueE":["É a medida do espaço que","uma figura plana ocupa."],"explicando":["Contamos quantos quadrados","de 1 unidade cabem nela."],"exemplo":["Um piso de 3 m por 4 m","tem área de 12 m²."]}],"abertura":{"antes":"Uma sala tem 8 m de largura","destaque":"8 m × 5 m","depois":"Qual é a área do piso?","alternativas":["13 m²","26 m²","40 m²","85 m²"],"calculo":"8 × 5"},"blocos":[{"tipo":"faixa","momento":"ver","antes":"Problema: piso de","numero":"8 m × 5 m","depois":"→ qual a área?","legenda":"Vamos descobrir como se calcula a *área*."},{"tipo":"termo","chave":"area","momento":"ver","legenda":"Área = quantos quadradinhos *cabem* na figura."},{"tipo":"figura","momento":"ver","forma":"retangulo","medidas":{"base":"8","altura":"5"},"unidade":"m","fonte":"pág. 2"},{"tipo":"revelar","momento":"ver","legenda":"Confere com o que a turma achou? ✓"},{"tipo":"formula","momento":"montar","nome":"Área do paralelogramo","formula":"A = b × h","valores":{"b":"7,5","h":"4"},"unidades":{"A":"cm²","b":"cm","h":"cm"},"variaveis":{"b":"base","h":"altura"}},{"tipo":"expressoes","momento":"suavez","titulo":"Sua vez: áreas em cm²","itens":[{"rotulo":"a)","expr":"12 × 3,5","unidade":"cm²"},{"rotulo":"b)","expr":"9 × 9","unidade":"cm²"}]},{"tipo":"desafio","momento":"suavez","enunciado":["Um terreno retangular tem 25 m","por 12 m. Sua área é:"],"alternativas":["37 m²","300 m²","150 m²","600 m²"],"calculo":"25 × 12","unidade":"m²"},{"tipo":"fecho","momento":"fechamento","titulo":"REGRA DE HOJE","regra":["Retângulo e paralelogramo","área = base × altura"],"pegaTitulo":"CUIDADO: PEGADINHA","pega":["A altura é a linha reta,","não o lado inclinado!"]}],"duvidas":[]}`;

function montarPrompt({ tituloAula, disciplina, nivel, prioridades, respostas, errosAnteriores, planoAnterior, qtdPdfs, temTexto }) {
  const fontes = [];
  if (qtdPdfs > 0) fontes.push(qtdPdfs === 1 ? "o PDF anexado" : `os ${qtdPdfs} PDFs anexados`);
  if (temTexto) fontes.push("o texto colado");
  const partes = [
    `Voce e um professor experiente criando uma AULA ANIMADA para a turma, a partir de ${fontes.join(" e ")} (o material da Seduc-SP).`,
    disciplina ? `Disciplina: ${disciplina}.` : "",
    nivel ? `Nivel: ${nivel}.` : "",
    tituloAula ? `Titulo dado pelo professor: ${tituloAula}.` : "",
    prioridades ? `O professor pediu atencao especial para: ${prioridades}` : "",
    "Voce nao desenha nem calcula: apenas escolhe o que ensinar e em que ordem, usando os blocos abaixo. O sistema anima e calcula.",
    CATALOGO,
    REGRAS,
    FORMATO,
    EXEMPLO,
  ];
  if (respostas.length) {
    partes.push("O professor RESPONDEU as duvidas da versao anterior. Considere estas respostas como verdade:\n" + respostas.map((r) => `- Pergunta: ${r.pergunta}\n  Resposta: ${r.resposta}`).join("\n"));
  }
  if (planoAnterior && errosAnteriores.length) {
    partes.push("A versao anterior do plano teve PROBLEMAS encontrados pela conferencia automatica. Corrija-os e devolva o plano COMPLETO de novo:\n" + errosAnteriores.map((e) => "- " + e).join("\n") + "\n\nPlano anterior:\n" + JSON.stringify(planoAnterior));
  }
  return partes.filter(Boolean).join("\n\n");
}

const listaTexto = (v, n, max) => (Array.isArray(v) ? v : []).map((x) => texto(x, max)).filter(Boolean).slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Metodo nao permitido." });

  const { idToken, pdfs, pdfBase64, pdfUrl, textoColado, tituloAula, disciplina, nivel, prioridades, assinatura } = req.body || {};
  if (!(await verificarToken(idToken))) return res.status(401).json({ erro: "Nao autorizado." });

  const { documentos, nomes, erro } = await coletarPdfs({ pdfs, pdfBase64, pdfUrl });
  if (erro) return res.status(400).json({ erro });
  const textoMaterial = texto(textoColado, MAX_TEXTO);
  if (documentos.length === 0 && !textoMaterial) return res.status(400).json({ erro: "Anexe um PDF ou cole o texto do material." });

  const respostas = (Array.isArray(req.body?.respostas) ? req.body.respostas : [])
    .slice(0, 8)
    .map((r) => ({ pergunta: texto(r?.pergunta, 400), resposta: texto(r?.resposta, 800) }))
    .filter((r) => r.pergunta && r.resposta);
  const errosAnteriores = listaTexto(req.body?.errosAnteriores, 12, 400);
  const planoAnterior = req.body?.planoAnterior && typeof req.body.planoAnterior === "object" ? req.body.planoAnterior : null;

  const prompt = montarPrompt({
    tituloAula: texto(tituloAula, 200),
    disciplina: texto(disciplina, 100),
    nivel: texto(nivel, 60),
    prioridades: texto(prioridades, 1000),
    respostas,
    errosAnteriores,
    planoAnterior,
    qtdPdfs: documentos.length,
    temTexto: !!textoMaterial,
  });

  const partes = Math.max(1, documentos.length + (textoMaterial ? 1 : 0));
  const conteudo = [];
  documentos.forEach((data, i) => {
    if (partes > 1) conteudo.push({ type: "text", text: `MATERIAL ${i + 1} de ${partes}${nomes[i] ? ` (arquivo: ${nomes[i]})` : ""}:` });
    conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
  });
  if (textoMaterial) conteudo.push({ type: "text", text: `${partes > 1 ? `MATERIAL ${partes} de ${partes} (texto colado):\n` : ""}<material>\n${textoMaterial}\n</material>` });
  conteudo.push({ type: "text", text: prompt });

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 7000, messages: [{ role: "user", content: conteudo }] }),
    });
    if (!resp.ok) {
      console.error("Erro Anthropic:", await resp.text());
      return res.status(502).json({ erro: "Erro ao gerar com IA." });
    }
    const data = await resp.json();
    const textoResposta = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    const m = textoResposta.match(/\{[\s\S]*\}/);
    if (!m) return res.status(502).json({ erro: "Resposta da IA em formato inesperado. Tente de novo." });
    let bruto;
    try {
      bruto = JSON.parse(m[0]);
    } catch {
      return res.status(502).json({ erro: "A IA devolveu um texto incompleto. Tente de novo (ou com menos paginas)." });
    }

    // compila e confere aqui mesmo: o navegador recebe a aula pronta e o relatorio
    const plano = normalizarPlano(bruto);
    const { aula, relatorio } = compilarAula(plano, { assinatura: texto(assinatura, 300) || ASSINATURA_PADRAO });
    const verificacao = verificarAula(aula);
    return res.status(200).json({
      plano,
      aula,
      relatorio,
      verificacao,
      erros: [...relatorio.erros, ...verificacao.erros],
      modelo: MODEL,
      geradoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erro no gerador de aula animada:", err);
    return res.status(500).json({ erro: "Erro interno ao gerar a aula." });
  }
}
