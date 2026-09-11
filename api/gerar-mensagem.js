const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MODEL = "claude-haiku-4-5-20251001";

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

  const { idToken } = req.body || {};

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  const prompt = `Escreva UMA pequena reflexao motivacional (2 a 3 frases encadeadas, formando um pensamento completo) para estudantes do ensino medio de uma escola publica em Sao Paulo que estudam Historia e Tecnologia (Desenvolvimento de Sistemas). Nao seja telegrafica nem curta demais, mas mantenha entre 35 e 60 palavras no total, para caber bem na tela.

O tom deve ser acolhedor, encorajador e conectado ao valor de aprender, persistir e construir o proprio futuro atraves do estudo. Quando fizer sentido, pode citar a ligacao entre entender o passado (Historia) e construir o futuro (Tecnologia), mas isso nao e obrigatorio em toda mensagem — varie os temas.

Nao use aspas, nao use markdown, nao use emojis, nao use hashtags. Responda APENAS com a frase pronta, em portugues do Brasil, nada mais.`;

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
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const erroTexto = await resp.text();
      console.error("Erro Anthropic:", erroTexto);
      return res.status(502).json({ erro: "Erro ao gerar mensagem com IA." });
    }

    const data = await resp.json();
    const texto = (data.content?.[0]?.text || "").trim().replace(/^["']|["']$/g, "");

    if (!texto) {
      return res.status(502).json({ erro: "Resposta da IA vazia." });
    }

    return res.status(200).json({ texto });
  } catch (err) {
    console.error("Erro ao gerar mensagem motivacional:", err);
    return res.status(500).json({ erro: "Erro interno ao gerar mensagem." });
  }
}
