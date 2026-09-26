// "Preencher aula com IA": le o material (PDFs e/ou texto colado) e devolve:
//  - os campos da aula (identificacao, titulo, "O que e isso?", "Para que serve?", resumo), sempre;
//  - o "Material de estudo" completo, so no modo "completo" (material bruto da Seduc).
// Seguranca: so o professor (e-mail conferido no servidor) pode usar.
// Regra principal: a IA so usa o que esta no material; o que vier de fora do material
// volta marcado como "complemento" para o professor conferir antes de publicar.

import { CATALOGO_ICONES, chaveIcone } from "../src/utils/catalogoIcones.js";

const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_PDFS = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB somados
const MAX_TEXTO = 200000; // caracteres de texto colado

// Lista de ilustracoes que a IA pode escolher (chave: dica).
const LISTA_ICONES = Object.entries(CATALOGO_ICONES)
  .map(([chave, info]) => `${chave} (${info.dica})`)
  .join("; ");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

// So o professor (e-mail abaixo) pode gastar a cota da IA. Mesma regra que ja
// existe na tela de Admin, agora tambem conferida no servidor.
const EMAIL_PROFESSOR = "thiago.rpba@gmail.com";

async function verificarToken(idToken) {
  if (!idToken) return false;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return false;
    const data = await resp.json();
    return Array.isArray(data.users) && data.users.some((u) => u.email === EMAIL_PROFESSOR);
  } catch {
    return false;
  }
}

function hostPermitido(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname === "firebasestorage.googleapis.com" ||
      u.hostname === "storage.googleapis.com" ||
      u.hostname.endsWith(".firebasestorage.app")
    );
  } catch {
    return false;
  }
}

// Junta os PDFs recebidos (base64 ou endereco do Storage). Devolve { documentos } ou { erro }.
async function coletarPdfs({ pdfs, pdfBase64, pdfUrl }) {
  const itens = [];
  if (Array.isArray(pdfs) && pdfs.length > 0) itens.push(...pdfs);
  else if (pdfBase64) itens.push({ base64: pdfBase64 });
  else if (pdfUrl) itens.push({ url: pdfUrl });

  if (itens.length > MAX_PDFS) return { erro: `Envie no maximo ${MAX_PDFS} PDFs por vez.` };

  const documentos = [];
  const nomes = [];
  let totalBytes = 0;
  for (const item of itens) {
    nomes.push(typeof item?.nome === "string" ? item.nome.slice(0, 120) : "");
    let b64 = typeof item?.base64 === "string" ? item.base64 : null;
    if (!b64 && typeof item?.url === "string") {
      if (!hostPermitido(item.url)) return { erro: "Endereco de PDF nao permitido." };
      try {
        const respPdf = await fetch(item.url);
        if (!respPdf.ok) return { erro: "Nao foi possivel baixar um dos PDFs salvos." };
        const buffer = await respPdf.arrayBuffer();
        if (buffer.byteLength > MAX_PDF_BYTES) return { erro: "PDF muito grande (limite de 8MB por arquivo)." };
        b64 = Buffer.from(buffer).toString("base64");
      } catch {
        return { erro: "Erro ao baixar um dos PDFs salvos." };
      }
    }
    if (!b64) return { erro: "PDF nao enviado." };
    const bytes = Math.ceil((b64.length * 3) / 4);
    if (bytes > MAX_PDF_BYTES) return { erro: "PDF muito grande (limite de 8MB por arquivo)." };
    totalBytes += bytes;
    if (totalBytes > MAX_TOTAL_BYTES) return { erro: "Os PDFs juntos passam de 20MB. Marque menos arquivos." };
    documentos.push(b64);
  }
  return { documentos, nomes };
}

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Aulas ja publicadas pelo professor: servem de modelo de formato e tom.
function blocoExemplos(exemplos) {
  const lista = (Array.isArray(exemplos) ? exemplos : [])
    .slice(0, 3)
    .map((e) => ({
      identificacao: texto(e?.numeroAula, 200),
      titulo: texto(e?.titulo, 200),
      oQueE: texto(e?.introducao, 600),
      paraQueServe: texto(e?.utilidade, 600),
    }))
    .filter((e) => e.titulo || e.oQueE);
  if (lista.length === 0) return "";
  return `
EXEMPLOS de aulas que o professor ja publicou (siga o FORMATO e o TOM, mas escreva MAIS CURTO e MAIS SIMPLES que eles):
${JSON.stringify(lista, null, 1)}
`;
}

const REGRAS_FIDELIDADE = `REGRAS OBRIGATORIAS (fidelidade ao material):
1. Use SOMENTE as informacoes que estao no material fornecido. Nao invente fatos, datas, nomes, numeros, formulas, citacoes nem exemplos.
2. Simplifique a linguagem sem mudar o sentido. Se simplificar deixaria uma informacao imprecisa, mantenha o termo tecnico e explique-o.
3. Se o material tiver trechos confusos, contraditorios ou possivelmente desatualizados, NAO corrija por conta propria: registre em "avisos" para o professor revisar.`;

const FORMATO_CAMPOS = `  "campos": {
    "numero": numero da aula como aparece no material (ex.: "Aula 12" -> 12) ou null se o material nao disser,
    "nomeAula": "nome da aula/unidade como aparece no material, curto (ate 12 palavras)",
    "titulo": "titulo claro e atrativo para os alunos (ate 12 palavras)",
    "introducao": "para 'O que e isso?': 1 ou 2 frases curtas (no maximo 35 palavras) explicando o assunto",
    "utilidade": "para 'Para que serve?': 1 ou 2 frases curtas (no maximo 35 palavras) com a utilidade pratica, incentivando o estudo",
    "resumo": "de 3 a 5 frases curtas com os pontos principais do material"
  }`;

function montarPrompt({ modo, tituloAula, disciplina, prioridades, qtdPdfs, temTexto, exemplos }) {
  const fontes = [];
  if (qtdPdfs === 1) fontes.push("o PDF anexado");
  if (qtdPdfs > 1) fontes.push(`os ${qtdPdfs} PDFs anexados`);
  if (temTexto) fontes.push("o texto colado pelo professor (entre as marcas <material> e </material>)");

  const cabecalho = `Voce vai ajudar um professor do ensino medio da rede estadual de Sao Paulo a publicar uma aula, a partir de ${fontes.join(" e ")}.
${tituloAula ? `Titulo que o professor ja escreveu: "${tituloAula}".` : ""}
${disciplina ? `Disciplina: ${disciplina}.` : ""}
Os alunos leem no celular, em casa. Tudo deve ser curto, em linguagem simples e clara, em portugues do Brasil.
${blocoExemplos(exemplos)}
${REGRAS_FIDELIDADE}`;

  if (modo === "campos") {
    return `${cabecalho}

O material foi preparado pelo proprio professor. Sua tarefa e so preencher os campos da aula.

Responda APENAS com um JSON valido (sem markdown, sem texto fora do JSON), exatamente neste formato:

{
${FORMATO_CAMPOS},
  "avisos": ["pontos que o professor precisa conferir (pode ser lista vazia)"]
}`;
  }

  const partes = Math.max(1, qtdPdfs + (temTexto ? 1 : 0));
  const { minSecoes, maxSecoes } = limitesSecoes(partes);
  const regraPartes = partes > 1
    ? `4. Voce recebeu ${partes} materiais diferentes (cada um vem antes marcado como "MATERIAL 1", "MATERIAL 2"...). TODOS tem o MESMO peso: cada material deve ganhar mais ou menos o mesmo numero de secoes, e os conceitos principais de CADA um devem aparecer. Nao deixe um material "engolir" o outro. Em cada secao, informe em "parte" o numero do material de onde ela veio. Siga a ordem dos materiais.`
    : `4. Se o material for extenso, condense: fique so com o essencial para a aula. Em cada secao use "parte": 1.`;

  return `${cabecalho}
${regraPartes} ${prioridades ? `De destaque a estes topicos priorizados pelo professor: ${prioridades}` : "Mantenha o foco no tema central da aula."}
5. No material de estudo, se voce precisar acrescentar algo que NAO esta no material (uma definicao que o material nao traz, um exemplo do dia a dia, uma frase de ligacao com conteudo novo), marque aquele item com "complemento": true. Tudo que vem do material fica com "complemento": false.
6. Uma definicao complementar deve ser a definicao padrao de livro didatico, curta e sem opinioes.
7. CONTEXTO: escreva de 2 a 4 frases curtas que situam o aluno antes do conteudo. Use a situacao-problema, o "ponto de partida" ou a "contextualizacao" do proprio material (reescrita de forma simples). So se o material nao tiver nada disso, escreva uma ligacao simples com o dia a dia e marque "contextoComplemento": true.
8. PALAVRAS-CHAVE: TODA palavra tecnica ou dificil (que um aluno do ensino medio pode nao conhecer) que aparecer no contexto ou nas secoes TEM que estar em "termos", escrita EXATAMENTE como aparece no texto (mesma grafia). Nao inclua termos que nao aparecem no texto. Explique cada termo com palavras simples, sem usar outro termo dificil.
9. ILUSTRACAO: em "icones", escolha de 1 a 3 chaves da lista abaixo, da mais ligada a menos ligada ao assunto ESPECIFICO desta aula (nao a materia em geral). Use SOMENTE chaves da lista.
Lista: ${LISTA_ICONES}

O material e o original da Seduc. Sua tarefa: preencher os campos da aula E montar o material de estudo.

Responda APENAS com um JSON valido (sem markdown, sem texto fora do JSON), exatamente neste formato:

{
${FORMATO_CAMPOS},
  "material": {
    "titulo": "titulo curto e claro do material",
    "resumo": "1 ou 2 frases dizendo do que trata a aula",
    "contexto": "2 a 4 frases curtas que situam o aluno (regra 7)",
    "contextoComplemento": false,
    "icones": ["chave1", "chave2", "chave3"],
    "secoes": [
      { "titulo": "titulo da secao", "texto": "de 2 a 5 frases curtas e claras", "parte": 1, "complemento": false }
    ],
    "termos": [
      { "termo": "palavra exatamente como aparece no texto", "definicao": "1 ou 2 frases simples", "complemento": false }
    ]
  },
  "avisos": ["pontos que o professor precisa conferir (pode ser lista vazia)"]
}

Limites do material: de ${minSecoes} a ${maxSecoes} secoes; de 3 a 15 termos.`;
}

// Mais materiais anexados = mais secoes (para caber todos com o mesmo peso).
function limitesSecoes(partes) {
  if (partes <= 1) return { minSecoes: 3, maxSecoes: 8 };
  return { minSecoes: Math.min(3 * partes, 10), maxSecoes: Math.min(5 * partes, 12) };
}

function normalizarCampos(bruto) {
  const n = Number.parseInt(bruto?.numero, 10);
  return {
    numero: Number.isFinite(n) && n > 0 && n < 1000 ? n : null,
    nomeAula: texto(bruto?.nomeAula, 200),
    titulo: texto(bruto?.titulo, 200),
    introducao: texto(bruto?.introducao, 800),
    utilidade: texto(bruto?.utilidade, 800),
    resumo: texto(bruto?.resumo, 2000),
  };
}

// Garante o formato esperado, mesmo que a IA erre algum campo.
function normalizarMaterial(bruto, avisos, partes) {
  const secoes = (Array.isArray(bruto?.secoes) ? bruto.secoes : [])
    .map((s) => {
      const p = Number.parseInt(s?.parte, 10);
      return {
        titulo: texto(s?.titulo, 200),
        texto: texto(s?.texto, 3000),
        parte: Number.isFinite(p) && p >= 1 && p <= partes ? p : 1,
        complemento: s?.complemento === true,
      };
    })
    .filter((s) => s.titulo || s.texto)
    .slice(0, 12);
  const vistos = new Set();
  const termos = (Array.isArray(bruto?.termos) ? bruto.termos : [])
    .map((t) => ({ termo: texto(t?.termo, 150), definicao: texto(t?.definicao, 1000), complemento: t?.complemento === true }))
    .filter((t) => {
      const k = t.termo.toLowerCase();
      if (!t.termo || !t.definicao || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 15);
  const icones = [...new Set((Array.isArray(bruto?.icones) ? bruto.icones : []).map(chaveIcone).filter(Boolean))].slice(0, 3);
  const contexto = texto(bruto?.contexto, 1200);
  return {
    titulo: texto(bruto?.titulo, 200),
    resumo: texto(bruto?.resumo, 800),
    contexto,
    contextoComplemento: !!contexto && bruto?.contextoComplemento === true,
    icones: icones.length ? icones : ["geral"],
    secoes,
    termos,
    avisos,
  };
}

function normalizarAvisos(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((a) => texto(a, 500))
    .filter(Boolean)
    .slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Metodo nao permitido." });
  }

  const { idToken, pdfs, pdfBase64, pdfUrl, textoColado, tituloAula, disciplina, prioridades, exemplos } = req.body || {};
  const modo = req.body?.modo === "campos" ? "campos" : "completo";

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  const { documentos, nomes, erro } = await coletarPdfs({ pdfs, pdfBase64, pdfUrl });
  if (erro) return res.status(400).json({ erro });

  const textoMaterial = texto(textoColado, MAX_TEXTO);
  if (documentos.length === 0 && !textoMaterial) {
    return res.status(400).json({ erro: "Anexe um PDF ou cole o texto do material." });
  }

  const prompt = montarPrompt({
    modo,
    tituloAula: texto(tituloAula, 200),
    disciplina: texto(disciplina, 100),
    prioridades: texto(prioridades, 1000),
    qtdPdfs: documentos.length,
    temTexto: !!textoMaterial,
    exemplos,
  });

  // Cada material vem marcado com o numero, para a IA dar o mesmo peso a todos.
  const partes = Math.max(1, documentos.length + (textoMaterial ? 1 : 0));
  const conteudo = [];
  documentos.forEach((data, i) => {
    if (partes > 1) conteudo.push({ type: "text", text: `MATERIAL ${i + 1} de ${partes}${nomes[i] ? ` (arquivo: ${nomes[i]})` : ""}:` });
    conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
  });
  if (textoMaterial) {
    conteudo.push({
      type: "text",
      text: `${partes > 1 ? `MATERIAL ${partes} de ${partes} (texto colado):\n` : ""}<material>\n${textoMaterial}\n</material>`,
    });
  }
  conteudo.push({ type: "text", text: prompt });

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: modo === "campos" ? 1500 : 6000,
        messages: [{ role: "user", content: conteudo }],
      }),
    });

    if (!resp.ok) {
      const erroTexto = await resp.text();
      console.error("Erro Anthropic:", erroTexto);
      return res.status(502).json({ erro: "Erro ao gerar com IA." });
    }

    const data = await resp.json();
    const textoResposta = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ erro: "Resposta da IA em formato inesperado. Tente de novo." });
    }

    let bruto;
    try {
      bruto = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ erro: "A IA devolveu um texto incompleto. Tente de novo (ou com menos paginas)." });
    }

    const campos = normalizarCampos(bruto?.campos);
    const avisos = normalizarAvisos(bruto?.avisos);
    if (!campos.titulo && !campos.introducao) {
      return res.status(502).json({ erro: "A IA nao conseguiu ler o material. Tente de novo." });
    }

    if (modo === "campos") {
      return res.status(200).json({ campos, avisos });
    }

    const material = normalizarMaterial(bruto?.material, avisos, partes);
    if (material.secoes.length === 0) {
      return res.status(502).json({ erro: "A IA nao conseguiu montar o material de estudo. Tente de novo." });
    }

    return res.status(200).json({
      campos,
      avisos,
      material: { ...material, geradoEm: new Date().toISOString(), modelo: MODEL },
    });
  } catch (err) {
    console.error("Erro no gerador:", err);
    return res.status(500).json({ erro: "Erro interno ao gerar com IA." });
  }
}
