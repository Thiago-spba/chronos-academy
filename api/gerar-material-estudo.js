// Gera o "Material de estudo" de uma aula a partir do material da Seduc (PDFs e/ou texto colado).
// Mesmo padrao de seguranca do api/gerar-conteudo.js (so o professor logado pode usar).
// Regra principal: a IA so reescreve/resume o que esta no material; tudo que vier de fora
// volta marcado como "complemento" para o professor conferir antes de publicar.

const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_PDFS = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB somados
const MAX_TEXTO = 200000; // caracteres de texto colado

export const TEMAS = [
  "historia", "matematica", "programacao", "tecnologia", "redes",
  "seguranca", "carreira", "comunicacao", "ciencias", "geral",
];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

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
    return Array.isArray(data.users) && data.users.length > 0;
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
  let totalBytes = 0;
  for (const item of itens) {
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
  return { documentos };
}

function montarPrompt({ tituloAula, disciplina, prioridades, qtdPdfs, temTexto }) {
  const fontes = [];
  if (qtdPdfs === 1) fontes.push("o PDF anexado");
  if (qtdPdfs > 1) fontes.push(`os ${qtdPdfs} PDFs anexados`);
  if (temTexto) fontes.push("o texto colado pelo professor (entre as marcas <material> e </material>)");

  return `Voce vai preparar o MATERIAL DE ESTUDO de uma aula do ensino medio da rede estadual de Sao Paulo, a partir de ${fontes.join(" e ")}.
${tituloAula ? `Titulo da aula: "${tituloAula}".` : ""}
${disciplina ? `Disciplina: ${disciplina}.` : ""}
${prioridades ? `Topicos que o professor quer priorizar nesta aula: ${prioridades}` : ""}

O material sera lido por alunos no celular, em casa, para estudar e lembrar do que foi dado em aula.

REGRAS OBRIGATORIAS (fidelidade ao material):
1. Use SOMENTE as informacoes que estao no material fornecido. Nao invente fatos, datas, nomes, numeros, formulas, citacoes nem exemplos.
2. Simplifique a linguagem sem mudar o sentido. Se simplificar deixaria uma informacao imprecisa, mantenha o termo tecnico e explique-o.
3. Se o material for extenso, condense: fique so com o essencial para a aula, no maximo 8 secoes. ${prioridades ? "De destaque aos topicos priorizados pelo professor." : "Mantenha o foco no tema central da aula."}
4. Se voce precisar acrescentar algo que NAO esta no material (uma definicao que o material nao traz, um exemplo do dia a dia, uma frase de ligacao com conteudo novo), marque aquele item com "complemento": true. Tudo que vem do material fica com "complemento": false.
5. Uma definicao complementar deve ser a definicao padrao de livro didatico, curta e sem opinioes.
6. Se o material tiver trechos confusos, contraditorios ou possivelmente desatualizados, NAO corrija por conta propria: registre em "avisos" para o professor revisar.

Responda APENAS com um JSON valido (sem markdown, sem texto fora do JSON), exatamente neste formato:

{
  "titulo": "titulo curto e claro do material",
  "resumo": "1 ou 2 frases dizendo do que trata a aula",
  "tema": "um destes valores: ${TEMAS.join(", ")}",
  "secoes": [
    { "titulo": "titulo da secao", "texto": "de 2 a 5 frases curtas e claras", "complemento": false }
  ],
  "termos": [
    { "termo": "palavra ou expressao importante", "definicao": "1 ou 2 frases simples", "complemento": false }
  ],
  "avisos": ["pontos que o professor precisa conferir (pode ser lista vazia)"]
}

Limites: de 3 a 8 secoes; de 3 a 10 termos. Escreva em portugues do Brasil, linguagem clara e direta, adequada para alunos do ensino medio.`;
}

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Garante o formato esperado, mesmo que a IA erre algum campo.
function normalizarMaterial(bruto) {
  const secoes = (Array.isArray(bruto?.secoes) ? bruto.secoes : [])
    .map((s) => ({ titulo: texto(s?.titulo, 200), texto: texto(s?.texto, 3000), complemento: s?.complemento === true }))
    .filter((s) => s.titulo || s.texto)
    .slice(0, 10);
  const termos = (Array.isArray(bruto?.termos) ? bruto.termos : [])
    .map((t) => ({ termo: texto(t?.termo, 150), definicao: texto(t?.definicao, 1000), complemento: t?.complemento === true }))
    .filter((t) => t.termo && t.definicao)
    .slice(0, 15);
  const avisos = (Array.isArray(bruto?.avisos) ? bruto.avisos : [])
    .map((a) => texto(a, 500))
    .filter(Boolean)
    .slice(0, 10);
  const tema = TEMAS.includes(bruto?.tema) ? bruto.tema : "geral";
  return {
    titulo: texto(bruto?.titulo, 200),
    resumo: texto(bruto?.resumo, 800),
    tema,
    secoes,
    termos,
    avisos,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Metodo nao permitido." });
  }

  const { idToken, pdfs, pdfBase64, pdfUrl, textoColado, tituloAula, disciplina, prioridades } = req.body || {};

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  const { documentos, erro } = await coletarPdfs({ pdfs, pdfBase64, pdfUrl });
  if (erro) return res.status(400).json({ erro });

  const textoMaterial = texto(textoColado, MAX_TEXTO);
  if (documentos.length === 0 && !textoMaterial) {
    return res.status(400).json({ erro: "Anexe um PDF ou cole o texto do material." });
  }

  const prompt = montarPrompt({
    tituloAula: texto(tituloAula, 200),
    disciplina: texto(disciplina, 100),
    prioridades: texto(prioridades, 1000),
    qtdPdfs: documentos.length,
    temTexto: !!textoMaterial,
  });

  const conteudo = [
    ...documentos.map((data) => ({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data },
    })),
  ];
  if (textoMaterial) conteudo.push({ type: "text", text: `<material>\n${textoMaterial}\n</material>` });
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
        max_tokens: 6000,
        messages: [{ role: "user", content: conteudo }],
      }),
    });

    if (!resp.ok) {
      const erroTexto = await resp.text();
      console.error("Erro Anthropic:", erroTexto);
      return res.status(502).json({ erro: "Erro ao gerar o material com IA." });
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

    const material = normalizarMaterial(bruto);
    if (material.secoes.length === 0) {
      return res.status(502).json({ erro: "A IA nao conseguiu montar o material. Tente de novo." });
    }

    return res.status(200).json({
      material: { ...material, geradoEm: new Date().toISOString(), modelo: MODEL },
    });
  } catch (err) {
    console.error("Erro no gerador de material:", err);
    return res.status(500).json({ erro: "Erro interno ao gerar o material." });
  }
}
