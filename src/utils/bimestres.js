// Utilitarios de ano/bimestre e busca de aulas. Sem dependencias.
// Nada aqui grava dados: so le o formato que ja existe em chronos/dados_escola.
export const ANO_LEGADO = 2026; // modulo antigo sem ano no titulo (ex.: id "b3") = 2026

export function lerModulo(m) {
  const titulo = String((m && m.titulo) || '');
  const id = String((m && m.id) || '');
  let bim = null;
  let ano = null;
  let r = titulo.match(/(\d)\s*[º°o]?\s*bimestre/i);
  if (r) bim = Number(r[1]);
  r = titulo.match(/(20\d\d)/);
  if (r) ano = Number(r[1]);
  const q = id.match(/^b(\d)(?:-(20\d\d))?$/);
  if (q) {
    if (bim === null) bim = Number(q[1]);
    if (ano === null && q[2]) ano = Number(q[2]);
  }
  return { ano: ano === null ? ANO_LEGADO : ano, bim: bim === null ? 0 : bim };
}

export function chaveModulo(m) {
  const { ano, bim } = lerModulo(m);
  return ano * 10 + bim;
}

export function ordenarModulos(modulos) {
  return [...(modulos || [])].sort((a, b) => chaveModulo(a) - chaveModulo(b));
}

export function tituloModulo(ano, bim) {
  return bim + 'º Bimestre - ' + ano;
}

export function idModulo(ano, bim) {
  return 'b' + bim + '-' + ano;
}

export function acharModulo(modulos, ano, bim) {
  return (modulos || []).find((m) => {
    const l = lerModulo(m);
    return l.ano === ano && l.bim === bim;
  });
}

export function moduloEmAndamento(modulos) {
  return (modulos || []).find((m) => m.abertoPadrao) || null;
}

// Ano que os alunos veem "aberto": o do bimestre em andamento; sem ele, o ano mais recente com aulas.
export function anoAtualDaTurma(modulos) {
  const and = moduloEmAndamento(modulos);
  if (and) return lerModulo(and).ano;
  const lista = modulos || [];
  const comAulas = lista.filter((m) => m.aulas && m.aulas.length > 0);
  const base = comAulas.length > 0 ? comAulas : lista;
  if (base.length === 0) return new Date().getFullYear();
  return Math.max(...base.map((m) => lerModulo(m).ano));
}

// Opcoes do seletor de bimestre no formulario: os que existem + os do ano do calendario e do proximo
// que ainda nao existem (valor "novo:ANO:BIM"; sao criados so ao salvar a aula).
export function opcoesModulos(modulos, anoCalendario) {
  const lista = modulos || [];
  const anos = new Set([anoCalendario, anoCalendario + 1]);
  lista.forEach((m) => anos.add(lerModulo(m).ano));
  const opcoes = lista.map((m) => {
    const l = lerModulo(m);
    return { valor: m.id, ano: l.ano, bim: l.bim, novo: false, andamento: !!m.abertoPadrao, rotulo: m.titulo };
  });
  anos.forEach((ano) => {
    [1, 2, 3, 4].forEach((bim) => {
      if (!acharModulo(lista, ano, bim)) {
        opcoes.push({ valor: 'novo:' + ano + ':' + bim, ano, bim, novo: true, andamento: false, rotulo: tituloModulo(ano, bim) });
      }
    });
  });
  return opcoes.sort((a, b) => a.ano * 10 + a.bim - (b.ano * 10 + b.bim));
}

function chaveDoValor(modulos, valor) {
  const v = String(valor || '');
  const n = v.match(/^novo:(\d{4}):(\d)$/);
  if (n) return Number(n[1]) * 10 + Number(n[2]);
  const m = (modulos || []).find((x) => x.id === v);
  return m ? chaveModulo(m) : null;
}

// Sugestao para a caixinha "definir como em andamento": marcada quando o destino e mais novo
// que o bimestre em andamento atual (ou quando ainda nao existe nenhum em andamento).
export function deveMarcarAndamento(modulos, valor) {
  const alvo = chaveDoValor(modulos, valor);
  if (alvo === null) return false;
  const atual = moduloEmAndamento(modulos);
  if (!atual) return true;
  return alvo > chaveModulo(atual);
}

// Modulo sugerido ao trocar de turma no formulario: o em andamento; senao o mais recente.
export function moduloPadraoId(modulos) {
  const and = moduloEmAndamento(modulos);
  if (and) return and.id;
  const ord = ordenarModulos(modulos);
  return ord.length ? ord[ord.length - 1].id : '';
}

export function normalizar(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ºª°]/g, 'o')
    .toLowerCase();
}

// Busca simples e instantanea em todas as aulas (todos os anos). Todas as palavras precisam aparecer.
export function buscarAulas(modulos, termo) {
  const tokens = normalizar(termo).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const saida = [];
  ordenarModulos(modulos).forEach((modulo) => {
    (modulo.aulas || []).forEach((aula, indice) => {
      const titulo = normalizar(aula.titulo);
      const resto = normalizar([aula.numeroAula, aula.semana, aula.introducao, aula.utilidade, aula.materialTexto, modulo.titulo].join(' '));
      let pontos = 0;
      for (const t of tokens) {
        if (titulo.includes(t)) pontos += 3;
        else if (resto.includes(t)) pontos += 1;
        else return;
      }
      saida.push({ aula, modulo, indice, pontos, chave: chaveModulo(modulo) });
    });
  });
  saida.sort((a, b) => b.pontos - a.pontos || b.chave - a.chave || a.indice - b.indice);
  return saida;
}
