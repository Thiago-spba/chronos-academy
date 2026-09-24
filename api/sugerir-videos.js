// Sugere videos do YouTube (em portugues do Brasil) para uma aula.
// Precisa da variavel de ambiente YOUTUBE_API_KEY (YouTube Data API v3) configurada na Vercel.
const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MAX_RESULTADOS = 8;

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

// "PT1H2M3S" -> segundos
function duracaoEmSegundos(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  return (Number(m[1]) || 0) * 3600 + (Number(m[2]) || 0) * 60 + (Number(m[3]) || 0);
}

// segundos -> "15:30" ou "1:02:03"
function formatarDuracao(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const dois = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Metodo nao permitido." });
  }

  const { idToken, busca } = req.body || {};

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  const chave = process.env.YOUTUBE_API_KEY;
  if (!chave) {
    return res.status(503).json({ erro: "YOUTUBE_API_KEY_AUSENTE" });
  }

  const termo = String(busca || "").trim().slice(0, 150);
  if (termo.length < 3) {
    return res.status(400).json({ erro: "Digite pelo menos 3 letras para buscar." });
  }

  try {
    const paramsBusca = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: termo,
      maxResults: "20",
      relevanceLanguage: "pt",
      regionCode: "BR",
      videoEmbeddable: "true",
      safeSearch: "strict",
      key: chave,
    });
    const respBusca = await fetch(`https://www.googleapis.com/youtube/v3/search?${paramsBusca}`);
    if (!respBusca.ok) {
      const corpo = await respBusca.text();
      console.error("Erro YouTube search:", respBusca.status, corpo);
      if (respBusca.status === 403 && /quota/i.test(corpo)) {
        return res.status(429).json({ erro: "O limite diario gratuito do YouTube acabou. Tente novamente amanha." });
      }
      return res.status(502).json({ erro: "Erro ao buscar videos no YouTube." });
    }
    const dadosBusca = await respBusca.json();
    const ids = (dadosBusca.items || []).map((i) => i?.id?.videoId).filter(Boolean);
    if (ids.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    const paramsVideos = new URLSearchParams({
      part: "contentDetails,snippet,statistics,status",
      id: ids.join(","),
      key: chave,
    });
    const respVideos = await fetch(`https://www.googleapis.com/youtube/v3/videos?${paramsVideos}`);
    if (!respVideos.ok) {
      console.error("Erro YouTube videos:", respVideos.status, await respVideos.text());
      return res.status(502).json({ erro: "Erro ao ler os detalhes dos videos." });
    }
    const dadosVideos = await respVideos.json();
    const porId = new Map((dadosVideos.items || []).map((v) => [v.id, v]));

    const videos = [];
    for (const id of ids) {
      const v = porId.get(id);
      if (!v) continue;
      if (v.status && v.status.embeddable === false) continue;
      const seg = duracaoEmSegundos(v.contentDetails && v.contentDetails.duration);
      if (seg < 120 || seg > 5400) continue; // de 2 min a 1h30
      const idioma = String((v.snippet && (v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage)) || "").toLowerCase();
      if (idioma && !idioma.startsWith("pt")) continue;
      videos.push({
        videoId: id,
        titulo: (v.snippet && v.snippet.title) || "",
        canal: (v.snippet && v.snippet.channelTitle) || "",
        duracao: formatarDuracao(seg),
        visualizacoes: Number(v.statistics && v.statistics.viewCount) || 0,
        publicadoEm: (v.snippet && v.snippet.publishedAt) || "",
        miniatura: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      });
      if (videos.length >= MAX_RESULTADOS) break;
    }

    return res.status(200).json({ videos });
  } catch (err) {
    console.error("Erro ao sugerir videos:", err);
    return res.status(500).json({ erro: "Erro interno ao sugerir videos." });
  }
}
