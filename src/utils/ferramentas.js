import { idModulo, tituloModulo, acharModulo } from './bimestres.js';

// Salva uma ferramenta no bimestre escolhido (cria o bimestre se ainda nao existe).
// Em edicao, se o bimestre mudou, a ferramenta sai do antigo e entra no novo. Nao altera a lista recebida.
// destino: id de um bimestre existente ou "novo:ANO:BIM". Devolve { lista, alvoId }.
export function aplicarFerramenta(modulos, form, destinoPadrao, anoCalendario, novoId) {
  const { destino, ...dados } = form;
  const lista = (modulos || []).map((m) => ({ ...m, itens: [...(m.itens || [])] }));
  const alvoValor = destino || destinoPadrao;
  let alvo = lista.find((m) => m.id === alvoValor);
  if (!alvo) {
    const n = String(alvoValor).match(/^novo:(\d{4}):(\d)$/);
    const ano = n ? Number(n[1]) : anoCalendario;
    const bim = n ? Number(n[2]) : 1;
    alvo = acharModulo(lista, ano, bim);
    if (!alvo) {
      alvo = { id: idModulo(ano, bim), titulo: tituloModulo(ano, bim), abertoPadrao: !lista.some((m) => m.abertoPadrao), itens: [] };
      lista.push(alvo);
    }
  }
  if (dados.id) {
    const origem = lista.find((m) => m.itens.some((i) => i.id === dados.id));
    if (origem && origem.id === alvo.id) {
      alvo.itens = origem.itens.map((i) => (i.id === dados.id ? { ...i, ...dados } : i));
    } else {
      const antigo = origem ? (origem.itens.find((i) => i.id === dados.id) || {}) : {};
      if (origem) origem.itens = origem.itens.filter((i) => i.id !== dados.id);
      alvo.itens = [...alvo.itens, { ...antigo, ...dados, ordem: alvo.itens.length }];
    }
  } else {
    alvo.itens = [...alvo.itens, { ...dados, id: novoId, ordem: alvo.itens.length }];
  }
  return { lista, alvoId: alvo.id };
}
