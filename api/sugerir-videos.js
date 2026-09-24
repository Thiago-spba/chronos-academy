// Sugere videos do YouTube (em portugues do Brasil) para uma aula, com ajuda da IA:
//  1) a IA le a aula e cria as melhores buscas (com os termos do assunto);
//  2) o YouTube devolve candidatos em portugues;
//  3) a IA escolhe os que realmente ensinam o conteudo e explica o motivo.
// Se a IA falhar, cai para a busca simples (sem ajuda da IA).
// Precisa de YOUTUBE_API_KEY (YouTube Data API v3) e ANTHROPIC_API_KEY na Vercel.
const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_RESULTADOS = 8;
const MAX_CANDIDATOS = 24;

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

const cortar = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);

// Chama a IA e devolve o JSON da resposta (ou null se algo falhar).
async function perguntarIA(prompt, maxTokens) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
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
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      console.error("Erro Anthropic (videos):", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const texto = data.content?.[0]?.text || "";
    const m = texto.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.error("Falha ao consultar a IA (videos):", e);
    return null;
  }
}

async function buscarNoYoutube(termo, chave) {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: termo,
    maxResults: "12",
    relevanceLanguage: "pt",
    regionCode: "BR",
    videoEmbeddable: "true",
    safeSearch: "strict",
    key: chave,
  });
  const resp = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error("Erro YouTube search:", resp.status, corpo);
    const erro = new Error("youtube");
    erro.cota = resp.status === 403 && /quota/i.test(corpo);
    throw erro;
  }
  const dados = await resp.json();
  return (dados.items || []).map((i) => i?.id?.videoId).filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Metodo nao permitido." });
  }

  const { idToken, busca, tituloAula, disciplina, introducao, utilidade, materialTexto } = req.body || {};

  const autorizado = await verificarToken(idToken);
  if (!autorizado) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  const chave = process.env.YOUTUBE_API_KEY;
  if (!chave) {
    return res.status(503).json({ erro: "YOUTUBE_API_KEY_AUSENTE" });
  }

  const buscaManual = cortar(busca, 150);
  const contexto = {
    titulo: cortar(tituloAula, 200),
    disciplina: cortar(disciplina, 100),
    introducao: cortar(introducao, 600),
    utilidade: cortar(utilidade, 400),
    resumo: cortar(materialTexto, 800),
  };
  const temContexto = !!(contexto.titulo || contexto.introducao || contexto.resumo);
  if (!buscaManual && !temContexto) {
    return res.status(400).json({ erro: "Escreva o titulo da aula (ou use o campo de busca) antes de pedir sugestoes." });
  }
  if (buscaManual && buscaManual.length < 3) {
    return res.status(400).json({ erro: "Digite pelo menos 3 letras para buscar." });
  }

  const textoAula = [
    contexto.titulo && `Titulo: ${contexto.titulo}`,
    contexto.disciplina && `Disciplina: ${contexto.disciplina}`,
    contexto.introducao && `O que e: ${contexto.introducao}`,
    contexto.utilidade && `Para que serve: ${contexto.utilidade}`,
    contexto.resumo && `Resumo: ${contexto.resumo}`,
  ].filter(Boolean).join("\n");

  try {
    // 1) buscas: a do professor, ou as criadas pela IA a partir da aula
    let consultas = [];
    let iaAjudou = false;
    if (buscaManual) {
      consultas = [buscaManual];
    } else {
      const r = await perguntarIA(
        `Voce ajuda um professor brasileiro a encontrar videos-aula no YouTube para alunos do ensino medio.\n\nDADOS DA AULA:\n${textoAula}\n\nCrie 2 buscas curtas (de 3 a 7 palavras cada), em portugues do Brasil, usando os TERMOS TECNICOS do assunto real da aula (nao copie titulos criativos ou perguntas; use as palavras-chave que um video didatico sobre esse conteudo teria). As duas buscas devem ser diferentes entre si. Nao inclua o nome da disciplina se ele puder desviar o assunto.\n\nResponda APENAS com JSON valido: {"consultas":["busca 1","busca 2"]}`,
        200
      );
      const lista = Array.isArray(r?.consultas) ? r.consultas.map((c) => cortar(c, 100)).filter((c) => c.length >= 3) : [];
      if (lista.length > 0) {
        consultas = lista.slice(0, 2);
        iaAjudou = true;
      } else {
        consultas = [cortar(`${contexto.titulo} ${contexto.disciplina}`, 150) || cortar(contexto.resumo, 100)];
      }
    }

    // 2) candidatos do YouTube (sem repetir)
    const ids = [];
    for (const c of consultas) {
      for (const id of await buscarNoYoutube(c, chave)) {
        if (!ids.includes(id)) ids.push(id);
      }
    }
    if (ids.length === 0) {
      return res.status(200).json({ videos: [], consultas, ia: iaAjudou });
    }

    const paramsVideos = new URLSearchParams({
      part: "contentDetails,snippet,statistics,status",
      id: ids.slice(0, 40).join(","),
      key: chave,
    });
    const respVideos = await fetch(`https://www.googleapis.com/youtube/v3/videos?${paramsVideos}`);
    if (!respVideos.ok) {
      console.error("Erro YouTube videos:", respVideos.status, await respVideos.text());
      return res.status(502).json({ erro: "Erro ao ler os detalhes dos videos." });
    }
    const dadosVideos = await respVideos.json();
    const porId = new Map((dadosVideos.items || []).map((v) => [v.id, v]));

    let candidatos = [];
    for (const id of ids) {
      const v = porId.get(id);
      if (!v) continue;
      if (v.status && v.status.embeddable === false) continue;
      const seg = duracaoEmSegundos(v.contentDetails && v.contentDetails.duration);
      if (seg < 120 || seg > 5400) continue; // de 2 min a 1h30
      const idioma = String((v.snippet && (v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage)) || "").toLowerCase();
      if (idioma && !idioma.startsWith("pt")) continue;
      candidatos.push({
        videoId: id,
        titulo: (v.snippet && v.snippet.title) || "",
        canal: (v.snippet && v.snippet.channelTitle) || "",
        descricao: cortar(v.snippet && v.snippet.description, 200),
        duracao: formatarDuracao(seg),
        visualizacoes: Number(v.statistics && v.statistics.viewCount) || 0,
        publicadoEm: (v.snippet && v.snippet.publishedAt) || "",
        miniatura: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      });
    }
    candidatos = candidatos.slice(0, MAX_CANDIDATOS);

    // 3) a IA escolhe os que realmente combinam com a aula
    let escolhidos = null;
    if (candidatos.length > 0 && temContexto) {
      const lista = candidatos
        .map((c, i) => `${i + 1}. "${cortar(c.titulo, 110)}" | canal: ${cortar(c.canal, 50)} | ${c.duracao} | ${c.descricao}`)
        .join("\n");
      const r = await perguntarIA(
        `Voce ajuda um professor brasileiro a escolher videos-aula do YouTube para alunos do ensino medio.\n\nDADOS DA AULA:\n${textoAula}\n\nVIDEOS CANDIDATOS:\n${lista}\n\nEscolha ate ${MAX_RESULTADOS} videos que REALMENTE ensinam o conteudo desta aula, com linguagem clara para adolescentes. Rejeite videos fora do assunto (mesmo que da mesma disciplina), de outra area, propaganda de curso, opiniao politica, sensacionalismo ou nivel muito avancado. De uma nota de 0 a 10 para o quanto combina com a aula e inclua SO videos com nota 6 ou mais. Ordene do melhor para o pior. Em "motivo", escreva UMA frase curta em portugues dizendo o que o video ensina que combina com a aula.\n\nResponda APENAS com JSON valido: {"videos":[{"n":1,"nota":9,"motivo":"..."}]} onde n e o numero do video na lista.`,
        900
      );
      if (Array.isArray(r?.videos)) {
        const usados = new Set();
        escolhidos = [];
        for (const item of r.videos) {
          const n = Number(item?.n);
          const nota = Number(item?.nota);
          if (!Number.isInteger(n) || n < 1 || n > candidatos.length || usados.has(n)) continue;
          if (!(nota >= 6)) continue;
          usados.add(n);
          escolhidos.push({ ...candidatos[n - 1], motivo: cortar(item?.motivo, 180) });
          if (escolhidos.length >= MAX_RESULTADOS) break;
        }
        iaAjudou = true;
      }
    }

    const videos = (escolhidos !== null ? escolhidos : candidatos.slice(0, MAX_RESULTADOS)).map(({ descricao, ...resto }) => resto);
    const resposta = { videos, consultas, ia: iaAjudou };
    if (escolhidos !== null && videos.length === 0) {
      resposta.aviso = "A IA nao achou videos que combinem bem com esta aula. Tente escrever a sua busca no campo acima.";
    }
    return res.status(200).json(resposta);
  } catch (err) {
    if (err && err.message === "youtube") {
      return res.status(err.cota ? 429 : 502).json({
        erro: err.cota
          ? "O limite diario gratuito do YouTube acabou. Tente novamente amanha."
          : "Erro ao buscar videos no YouTube.",
      });
    }
    console.error("Erro ao sugerir videos:", err);
    return res.status(500).json({ erro: "Erro interno ao sugerir videos." });
  }
}
