with open(r'.\src\pages\Admin.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'import { BookOpen, Plus, Edit3, Trash2, X, Save, LogOut, GraduationCap, AlertTriangle, CheckCircle2, Video, FileText, AlignLeft, Target, Rocket, UploadCloud, Settings } from "lucide-react";',
    'import { BookOpen, Plus, Edit3, Trash2, X, Save, LogOut, GraduationCap, AlertTriangle, CheckCircle2, Video, FileText, AlignLeft, Target, Rocket, UploadCloud, Settings, Megaphone, Trophy } from "lucide-react";'
)

c = c.replace(
    'const [novaTurma, setNovaTurma] = useState({ id:"", nome: "", disciplina: "" });',
    '''const [novaTurma, setNovaTurma] = useState({ id:"", nome: "", disciplina: "" });
  const [modalAviso, setModalAviso] = useState(false);
  const [formAviso, setFormAviso] = useState({ ativo: true, tipo: 'comunicado', mensagem: '', duracao: 6 });
  const [salvandoAviso, setSalvandoAviso] = useState(false);'''
)

c = c.replace(
    '  const abrirNovoForm = () => {',
    '''  const abrirModalAviso = async () => {
    try {
      const snap = await getDoc(doc(db, 'chronos', 'config'));
      if (snap.exists() && snap.data().aviso) setFormAviso(snap.data().aviso);
    } catch(e) {}
    setModalAviso(true);
  };

  const salvarAviso = async () => {
    setSalvandoAviso(true);
    try {
      await setDoc(doc(db, 'chronos', 'config'), { aviso: formAviso }, { merge: true });
      setToast({ mensagem: 'Aviso atualizado!' });
      setModalAviso(false);
    } catch(e) { alert('Erro ao salvar aviso.'); }
    finally { setSalvandoAviso(false); }
  };

  const abrirNovoForm = () => {'''
)

modal_aviso = """
      {/* MODAL AVISO */}
      {modalAviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-stone-800 dark:text-slate-100 flex items-center gap-2"><Megaphone className="w-5 h-5 text-amber-500"/> Aviso para os Alunos</h3>
              <button onClick={() => setModalAviso(false)} className="p-2 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'comunicado'})} className={`flex items-center gap-2 p-3 rounded-xl border font-bold text-sm transition-colors ${formAviso.tipo==='comunicado' ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Megaphone className="w-4 h-4"/> Comunicado</button>
                <button type="button" onClick={() => setFormAviso({...formAviso, tipo:'parabens'})} className={`flex items-center gap-2 p-3 rounded-xl border font-bold text-sm transition-colors ${formAviso.tipo==='parabens' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'}`}><Trophy className="w-4 h-4"/> Parabéns</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Mensagem</label>
                <textarea rows={4} value={formAviso.mensagem} onChange={e => setFormAviso({...formAviso, mensagem: e.target.value})} placeholder="Ex: Material do 3º bimestre disponível!" className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none transition-colors"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Duração (segundos)</label>
                  <input type="number" min="3" max="30" value={formAviso.duracao} onChange={e => setFormAviso({...formAviso, duracao: Number(e.target.value)})} className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-colors"/>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-2 uppercase tracking-widest">Status</label>
                  <button type="button" onClick={() => setFormAviso({...formAviso, ativo: !formAviso.ativo})} className={`w-full p-3 rounded-xl font-bold text-sm transition-colors border ${formAviso.ativo ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700'}`}>{formAviso.ativo ? '✅ Ativo' : '⏸️ Desativado'}</button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalAviso(false)} className="flex-1 py-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                <button onClick={salvarAviso} disabled={salvandoAviso} className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-lg"><Save className="w-4 h-4"/> {salvandoAviso ? 'Salvando...' : 'Publicar Aviso'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DO PAINEL */}"""

c = c.replace('      {/* HEADER DO PAINEL */}', modal_aviso, 1)

c = c.replace(
    '<button onClick={() => setModalTurmas(true)} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-50dark:hover:bg-slate-800 transition-colors shadow-sm"><Settings className="w-5 h-5"/> Turmas</button>',
    '<button onClick={() => setModalTurmas(true)} className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm"><Settings className="w-5 h-5"/> Turmas</button><button onClick={abrirModalAviso} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors shadow-sm"><Megaphone className="w-5 h-5"/> Aviso</button>'
)

with open(r'.\src\pages\Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Admin.jsx atualizado')
