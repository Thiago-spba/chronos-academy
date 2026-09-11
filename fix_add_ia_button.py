path = "src/pages/Admin.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

erros = []

# 1. Adiciona o icone Sparkles na lista de imports
old1 = """  ChevronLeft, ChevronRight, LayoutGrid, List, Users
} from "lucide-react";"""
new1 = """  ChevronLeft, ChevronRight, LayoutGrid, List, Users, Sparkles
} from "lucide-react";"""

# 2. Adiciona o estado de carregamento da IA junto do estado dos PDFs
old2 = """  const [arquivosPdf, setArquivosPdf] = useState([]);"""
new2 = """  const [arquivosPdf, setArquivosPdf] = useState([]);
  const [gerandoIA, setGerandoIA] = useState(false);"""

# 3. Adiciona as funcoes auxiliares logo apos removePdfAntigo
old3 = """  const removePdfAntigo = (index) => {
    const newPdfs = form.pdfs.filter((_, i) => i !== index);
    setForm({ ...form, pdfs: newPdfs });
  };"""
new3 = """  const removePdfAntigo = (index) => {
    const newPdfs = form.pdfs.filter((_, i) => i !== index);
    setForm({ ...form, pdfs: newPdfs });
  };

  const arquivoParaBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const gerarComIA = async () => {
    setGerandoIA(true);
    try {
      let arquivo = arquivosPdf[0];
      if (!arquivo && form.pdfs.length > 0) {
        const resp = await fetch(form.pdfs[0].url);
        const blob = await resp.blob();
        arquivo = new File([blob], form.pdfs[0].titulo, { type: "application/pdf" });
      }
      if (!arquivo) {
        alert("Anexe um PDF antes de gerar com IA.");
        return;
      }
      const pdfBase64 = await arquivoParaBase64(arquivo);
      const idToken = await auth.currentUser.getIdToken();
      const resp = await fetch("/api/gerar-conteudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, pdfBase64, tituloAula: form.titulo }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.erro || "Erro ao gerar conteudo com IA.");
        return;
      }
      setForm(prev => ({ ...prev, introducao: data.introducao, utilidade: data.utilidade, materialTexto: data.materialTexto }));
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar conteudo com IA.");
    } finally {
      setGerandoIA(false);
    }
  };"""

# 4. Adiciona o botao logo apos o aviso de arquivos selecionados
old4 = """                    {arquivosPdf.length > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        {arquivosPdf.length} arquivo(s) novo(s) selecionado(s).
                      </p>
                    )}
                  </div>
                </div>"""
new4 = """                    {arquivosPdf.length > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        {arquivosPdf.length} arquivo(s) novo(s) selecionado(s).
                      </p>
                    )}
                    <button type="button" onClick={gerarComIA} disabled={gerandoIA || (arquivosPdf.length === 0 && form.pdfs.length === 0)} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      <Sparkles className="w-4 h-4"/> {gerandoIA ? "Gerando com IA..." : "Gerar com IA (a partir do PDF)"}
                    </button>
                  </div>
                </div>"""

for old, new, nome in [(old1, new1, "import Sparkles"), (old2, new2, "estado gerandoIA"), (old3, new3, "funcoes auxiliares"), (old4, new4, "botao Gerar com IA")]:
    if old not in content:
        erros.append(f"nao encontrado: {nome}")
    elif content.count(old) > 1:
        erros.append(f"aparece mais de uma vez: {nome}")
    else:
        content = content.replace(old, new)

if erros:
    print("ERRO: " + "; ".join(erros) + ". Nada foi alterado.")
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: botao Gerar com IA adicionado em " + path)
