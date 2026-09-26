// Lista de ilustracoes (icones) do Material de Estudo, por conceito.
// Usada no servidor (a IA escolhe ate 3 chaves daqui) e no site (desenho do icone).
// So dados, sem imports, para funcionar nos dois lados.
// Para acrescentar um conceito: inclua aqui e o icone em temasMaterial.js.

export const CATALOGO_ICONES = {
  // ── Tecnologia e programacao
  arquivo:        { rotulo: "Arquivos",               grupo: "tecnologia", dica: "arquivos, abrir/fechar, ler e gravar dados em disco" },
  planilha_csv:   { rotulo: "Planilhas e CSV",        grupo: "tecnologia", dica: "csv, planilhas, relatorios em tabela" },
  pasta:          { rotulo: "Pastas e caminhos",      grupo: "tecnologia", dica: "pastas, diretorios, caminhos de arquivo" },
  codigo:         { rotulo: "Código",                 grupo: "tecnologia", dica: "programacao em geral, sintaxe" },
  terminal:       { rotulo: "Terminal",               grupo: "tecnologia", dica: "linha de comando, executar programas, entrada e saida no console" },
  laco:           { rotulo: "Laços de repetição",     grupo: "tecnologia", dica: "for, while, iteracao, percorrer linhas" },
  condicao:       { rotulo: "Condições",              grupo: "tecnologia", dica: "if/else, decisoes, desvios" },
  funcao:         { rotulo: "Funções",                grupo: "tecnologia", dica: "funcoes, parametros, retorno, modularizacao" },
  variavel:       { rotulo: "Variáveis",              grupo: "tecnologia", dica: "variaveis, tipos de dados, strings, numeros" },
  lista:          { rotulo: "Listas e vetores",       grupo: "tecnologia", dica: "listas, vetores, arrays" },
  matriz:         { rotulo: "Matrizes",               grupo: "tecnologia", dica: "matrizes, tabelas em linhas e colunas" },
  banco_dados:    { rotulo: "Banco de dados",         grupo: "tecnologia", dica: "banco de dados, SQL, armazenamento permanente" },
  memoria:        { rotulo: "Memória",                grupo: "tecnologia", dica: "memoria RAM, recursos do sistema, buffer" },
  hardware:       { rotulo: "Hardware",               grupo: "tecnologia", dica: "processador, componentes do computador" },
  servidor:       { rotulo: "Servidores",             grupo: "tecnologia", dica: "servidores, logs, sistemas em funcionamento" },
  rede:           { rotulo: "Redes",                  grupo: "tecnologia", dica: "redes de computadores, protocolos" },
  internet:       { rotulo: "Internet",               grupo: "tecnologia", dica: "internet, web, sites" },
  nuvem:          { rotulo: "Nuvem",                  grupo: "tecnologia", dica: "computacao em nuvem, servicos online" },
  sem_fio:        { rotulo: "Conexão sem fio",        grupo: "tecnologia", dica: "wi-fi, conexao sem fio" },
  seguranca:      { rotulo: "Segurança digital",      grupo: "tecnologia", dica: "seguranca, protecao, boas praticas, evitar falhas" },
  senha:          { rotulo: "Senhas e acesso",        grupo: "tecnologia", dica: "senhas, autenticacao, criptografia" },
  erro:           { rotulo: "Erros e depuração",      grupo: "tecnologia", dica: "erros, excecoes, bugs, depuracao" },
  algoritmo:      { rotulo: "Algoritmos",             grupo: "tecnologia", dica: "algoritmos, fluxogramas, passo a passo" },
  binario:        { rotulo: "Lógica e binário",       grupo: "tecnologia", dica: "logica booleana, verdadeiro/falso, binario" },
  aplicativo:     { rotulo: "Aplicativos",            grupo: "tecnologia", dica: "aplicativos, telas, interfaces" },
  celular:        { rotulo: "Dispositivos móveis",    grupo: "tecnologia", dica: "celular, smartphone, apps moveis" },
  ia:             { rotulo: "Inteligência artificial",grupo: "tecnologia", dica: "inteligencia artificial, robos, automacao" },
  filtro:         { rotulo: "Filtros e buscas",       grupo: "tecnologia", dica: "filtrar, buscar, contar e selecionar dados" },
  organizacao:    { rotulo: "Organização do código",  grupo: "tecnologia", dica: "refatoracao, clean code, padroes, arquitetura" },

  // ── Matematica
  calculo:        { rotulo: "Cálculos",               grupo: "matematica", dica: "operacoes basicas, contas" },
  fracao:         { rotulo: "Frações e divisão",      grupo: "matematica", dica: "fracoes, divisao, razao" },
  porcentagem:    { rotulo: "Porcentagem",            grupo: "matematica", dica: "porcentagem, descontos, aumentos" },
  equacao:        { rotulo: "Equações e fórmulas",    grupo: "matematica", dica: "equacoes, algebra, formulas, somatorio" },
  raiz:           { rotulo: "Potências e raízes",     grupo: "matematica", dica: "potenciacao, radiciacao" },
  circulo:        { rotulo: "Círculo e π",            grupo: "matematica", dica: "circunferencia, pi, area do circulo" },
  geometria:      { rotulo: "Geometria",              grupo: "matematica", dica: "figuras planas e espaciais, formas" },
  triangulo:      { rotulo: "Triângulos",             grupo: "matematica", dica: "triangulos, Pitagoras, trigonometria" },
  medidas:        { rotulo: "Medidas",                grupo: "matematica", dica: "unidades de medida, comprimento, escala" },
  grafico:        { rotulo: "Gráficos e funções",     grupo: "matematica", dica: "graficos de linha, funcoes matematicas" },
  estatistica:    { rotulo: "Estatística",            grupo: "matematica", dica: "media, moda, mediana, graficos de barras" },
  proporcao:      { rotulo: "Proporções",             grupo: "matematica", dica: "proporcao, grafico de setores, partes de um todo" },
  probabilidade:  { rotulo: "Probabilidade",          grupo: "matematica", dica: "chances, eventos, dados" },
  financeira:     { rotulo: "Matemática financeira",  grupo: "matematica", dica: "juros, dinheiro, orcamento" },
  sequencia:      { rotulo: "Sequências",             grupo: "matematica", dica: "sequencias, progressoes, infinito" },

  // ── Historia
  linha_tempo:    { rotulo: "Linha do tempo",         grupo: "historia", dica: "cronologia, periodos historicos, mudancas no tempo" },
  antiguidade:    { rotulo: "Antiguidade",            grupo: "historia", dica: "Egito, Mesopotamia, Grecia, Roma, povos antigos" },
  idade_media:    { rotulo: "Idade Média",            grupo: "historia", dica: "feudalismo, castelos, senhores e servos" },
  monarquia:      { rotulo: "Monarquias e impérios",  grupo: "historia", dica: "reis, imperios, absolutismo, Brasil Imperio" },
  estado:         { rotulo: "Estado e governo",       grupo: "historia", dica: "republica, instituicoes, poder politico" },
  navegacoes:     { rotulo: "Grandes navegações",     grupo: "historia", dica: "navegacoes, colonizacao, rotas maritimas" },
  territorio:     { rotulo: "Mapas e territórios",    grupo: "historia", dica: "territorios, fronteiras, ocupacao do espaco" },
  mundo:          { rotulo: "História mundial",       grupo: "historia", dica: "acontecimentos mundiais, globalizacao" },
  conflito:       { rotulo: "Guerras e conflitos",    grupo: "historia", dica: "guerras, batalhas, conflitos armados" },
  revolucao:      { rotulo: "Revoluções",             grupo: "historia", dica: "revolucoes, independencia, movimentos sociais" },
  industria:      { rotulo: "Industrialização",       grupo: "historia", dica: "revolucao industrial, fabricas" },
  trabalho:       { rotulo: "Trabalho",               grupo: "historia", dica: "trabalhadores, direitos trabalhistas, operarios" },
  agricultura:    { rotulo: "Economia agrária",       grupo: "historia", dica: "agricultura, cafe, acucar, vida no campo" },
  documento:      { rotulo: "Documentos e leis",      grupo: "historia", dica: "constituicoes, tratados, fontes historicas" },
  direitos:       { rotulo: "Direitos e cidadania",   grupo: "historia", dica: "cidadania, justica, direitos humanos" },
  democracia:     { rotulo: "Democracia e voto",      grupo: "historia", dica: "eleicoes, voto, participacao politica" },
  sociedade:      { rotulo: "Sociedade e povos",      grupo: "historia", dica: "grupos sociais, povos, cultura" },
  religiao:       { rotulo: "Religião",               grupo: "historia", dica: "religioes, igreja, crencas" },
  cidade:         { rotulo: "Cidades",                grupo: "historia", dica: "urbanizacao, vida nas cidades" },
  comercio:       { rotulo: "Comércio",               grupo: "historia", dica: "comercio, trocas, mercados" },
  imprensa:       { rotulo: "Imprensa e propaganda",  grupo: "historia", dica: "jornais, meios de comunicacao, propaganda" },

  // ── Carreira, comunicacao e geral
  carreira:       { rotulo: "Carreira",               grupo: "geral", dica: "profissoes, mercado de trabalho, curriculo" },
  equipe:         { rotulo: "Trabalho em equipe",     grupo: "geral", dica: "colaboracao, parceria, cooperacao" },
  comunicacao:    { rotulo: "Comunicação",            grupo: "geral", dica: "dialogo, conversa, comunicacao" },
  apresentacao:   { rotulo: "Apresentações",          grupo: "geral", dica: "apresentar trabalhos, falar em publico" },
  metas:          { rotulo: "Metas e objetivos",      grupo: "geral", dica: "planejamento, objetivos, foco" },
  ideia:          { rotulo: "Criatividade",           grupo: "geral", dica: "ideias, inovacao, solucao de problemas" },
  crescimento:    { rotulo: "Crescimento",            grupo: "geral", dica: "evolucao, resultados, desenvolvimento pessoal" },
  socioemocional: { rotulo: "Socioemocional",         grupo: "geral", dica: "emocoes, autocontrole, empatia" },
  aprendizagem:   { rotulo: "Aprendizagem",           grupo: "geral", dica: "pensamento, raciocinio, estudo" },
  projeto:        { rotulo: "Projetos",               grupo: "geral", dica: "projetos, empreendedorismo, lancamentos" },
  ciencia:        { rotulo: "Ciências",               grupo: "geral", dica: "experimentos, ciencias da natureza" },
  natureza:       { rotulo: "Meio ambiente",          grupo: "geral", dica: "natureza, sustentabilidade" },
  geral:          { rotulo: "Estudo",                 grupo: "geral", dica: "quando nenhum outro combinar" },
};

export const CHAVES_ICONES = Object.keys(CATALOGO_ICONES);

// Nomes antigos (primeira versao) -> conceito novo.
export const ICONE_LEGADO = {
  historia: "linha_tempo", matematica: "equacao", programacao: "codigo", tecnologia: "hardware",
  redes: "rede", seguranca: "seguranca", carreira: "carreira", comunicacao: "comunicacao",
  ciencias: "ciencia", geral: "geral",
};

export function chaveIcone(valor) {
  const v = String(valor || "").trim().toLowerCase();
  if (CATALOGO_ICONES[v]) return v;
  if (ICONE_LEGADO[v]) return ICONE_LEGADO[v];
  return null;
}
