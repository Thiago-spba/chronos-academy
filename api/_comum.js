// Funcoes compartilhadas pelas rotas de IA novas (arquivos que comecam com "_" nao viram rota).
// Copiadas do gerar-material-estudo.js para nao mexer no que ja funciona em producao.

export const FIREBASE_API_KEY = "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8";
export const EMAIL_PROFESSOR = "thiago.rpba@gmail.com";
export const MAX_PDF_BYTES = 8 * 1024 * 1024;
export const MAX_PDFS = 5;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const MAX_TEXTO = 200000;

export const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function verificarToken(idToken) {
  if (!idToken) return false;
  try {
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return Array.isArray(data.users) && data.users.some((u) => u.email === EMAIL_PROFESSOR);
  } catch {
    return false;
  }
}

export function hostPermitido(url) {
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

// Junta os PDFs recebidos (base64 ou endereco do Storage). Devolve { documentos, nomes } ou { erro }.
export async function coletarPdfs({ pdfs, pdfBase64, pdfUrl }) {
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
