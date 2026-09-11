const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8MB

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Metodo nao permitido." });
  }

  const { idToken, pdfBase64, tituloAula } = req.body || {};

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  if (!pdfBase64 || typeof pdfBase64 !== "string") {
    return res.status(400).json({ erro: "PDF nao enviado." });
  }

  const tamanhoBytes = Math.ceil((pdfBase64.length * 3) / 4);
  if (tamanhoBytes > MAX_PDF_BYTES) {
    return res.status(400).json({ erro: "PDF muito grande (limite de 8MB)." });
  }

  const prompt = `Voce e um professor do ensino medio criando material didatico a partir do PDF anexado${tituloAula ? ` para a aula "${tituloAula}"` : ""}.

Leia o PDF e responda APENAS com um JSON valido (sem markdown, sem texto fora do JSON), no seguinte formato exato:

{
  "introducao": "um paragrafo curto e direto explicando o que e o assunto (para a secao 'O que e isso?')",
  "utilidade": "um paragrafo curto explicando a utilidade pratica do assunto no dia a dia ou em provas (para a secao 'Para que serve?')",
  "materialTexto": "um resumo em texto mais completo do conteudo do PDF, organizado em paragrafos, para os alunos estudarem"
}

Escreva em portugues do Brasil, em linguagem clara e direta, adequada para alunos do ensino medio.`;

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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const erroTexto = await resp.text();
      console.error("Erro Anthropic:", erroTexto);
      return res.status(502).json({ erro: "Erro ao gerar conteudo com IA." });
    }

    const data = await resp.json();
    const textoResposta = data.content?.[0]?.text || "";

    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ erro: "Resposta da IA em formato inesperado." });
    }

    const conteudo = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      introducao: conteudo.introducao || "",
      utilidade: conteudo.utilidade || "",
      materialTexto: conteudo.materialTexto || "",
    });
  } catch (err) {
    console.error("Erro no gerador de conteudo:", err);
    return res.status(500).json({ erro: "Erro interno ao gerar conteudo." });
  }
}
