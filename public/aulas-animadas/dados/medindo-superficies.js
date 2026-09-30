// Aula animada gerada no formato do motor do Chronos (lib/motor.js).
// Fonte: Currículo em Ação SEDUC-SP, 2ª série EM, 4º bimestre, "Medindo superfícies".
window.CHRONOS_AULA = {
 "titulo": "Medindo superfícies",
 "assinatura": "Aula elaborada por Thiago Fernando, professor, graduando em Engenharia da Computação, licenciado em Matemática.",
 "termos": {
  "area": {
   "chip": "Área",
   "titulo": "ÁREA",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "É a medida do tamanho",
      "de uma superfície."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "Contamos quantos quadrados de",
      "tamanho conhecido cabem nela."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "O retângulo ao lado tem",
      "área de 12 quadradinhos."
     ]
    }
   ]
  },
  "m2": {
   "chip": "m²",
   "titulo": "METRO QUADRADO (m²)",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "Área de um quadrado com",
      "1 metro de cada lado."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "O ² (lê-se \"ao quadrado\")",
      "lembra: lado × lado."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "1 m × 1 m = 1 m²:",
      "o tamanho de um tapete pequeno."
     ]
    }
   ]
  },
  "km2": {
   "chip": "km²",
   "titulo": "QUILÔMETRO QUADRADO (km²)",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "Área de um quadrado com",
      "1 quilômetro de cada lado."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "1 km = 1 000 metros.",
      "Serve para medir cidades."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "Igarapava (SP) tem",
      "468,2 km²."
     ]
    }
   ]
  },
  "ha": {
   "chip": "hectare",
   "titulo": "HECTARE (ha)",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "Área de um quadrado com",
      "100 metros de cada lado."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "100 m × 100 m = 10 000 m².",
      "Serve para medir fazendas."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "1 hectare é um pouco maior",
      "que um campo de futebol."
     ]
    }
   ]
  },
  "milhao": {
   "chip": "milhão",
   "titulo": "MILHÃO",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "1 milhão = 1 000 000",
      "(mil vezes mil)."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "2,66 milhões = 2,66 × 1 000 000",
      "= 2 660 000."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "Meio milhão = 0,5 milhão",
      "= 500 000."
     ]
    }
   ]
  },
  "cm2": {
   "chip": "cm²",
   "titulo": "CENTÍMETRO QUADRADO (cm²)",
   "secoes": [
    {
     "rotulo": "O QUE É",
     "linhas": [
      "Área de um quadrado com",
      "1 centímetro de cada lado."
     ]
    },
    {
     "rotulo": "EXPLICANDO",
     "linhas": [
      "1 cm é a distância entre dois",
      "números seguidos da régua."
     ]
    },
    {
     "rotulo": "EXEMPLO",
     "linhas": [
      "A unha do dedo mindinho",
      "tem mais ou menos 1 cm²."
     ]
    }
   ]
  }
 },
 "inicio": {
  "acoes": [
   {
    "tipo": "pergunta",
    "antes": "A cidade de Igarapava (SP) tem",
    "destaque": "468,2 km²",
    "depois": "Quanto é isso em hectares?",
    "alternativas": [
     "4,68 ha",
     "468,2 ha",
     "46 820 ha",
     "468 200 000 ha"
    ],
    "correta": 2
   }
  ],
  "legenda": "Vote com a turma: *qual vocês acham?*"
 },
 "passos": [
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "pergunta"
     ],
     "efeito": "sobe"
    },
    {
     "tipo": "faixa",
     "id": "fA",
     "antes": "Problema: Igarapava (SP) tem",
     "numero": "468,2 km²",
     "depois": "→ quantos hectares?",
     "junto": true,
     "atraso": 0.25
    },
    {
     "tipo": "termo",
     "chave": "area"
    },
    {
     "tipo": "contagem",
     "linhas": 3,
     "colunas": 4,
     "junto": true,
     "atraso": 0.2
    },
    {
     "tipo": "legenda",
     "t": "Área = quantos quadradinhos *cabem* na figura. Aqui: *12*.",
     "junto": true,
     "atraso": 0.6
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "area"
    },
    {
     "tipo": "sai",
     "alvos": [
      "contagem"
     ],
     "junto": true
    },
    {
     "tipo": "quadrado",
     "fase": "criar",
     "lado": "1 m",
     "area": "1 m²"
    },
    {
     "tipo": "termo",
     "chave": "m2",
     "junto": true
    },
    {
     "tipo": "legenda",
     "t": "1 m² = um quadrado com *1 metro* de cada lado.",
     "junto": true,
     "atraso": 0.3
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "m2"
    },
    {
     "tipo": "quadrado",
     "fase": "crescer",
     "lado": "1 km",
     "area": "1 km²",
     "partes": 10,
     "junto": true
    },
    {
     "tipo": "termo",
     "chave": "km2",
     "junto": true
    },
    {
     "tipo": "legenda",
     "t": "1 km² = um quadrado com *1 quilômetro* de cada lado.",
     "junto": true,
     "atraso": 0.3
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "km2"
    },
    {
     "tipo": "quadrado",
     "fase": "unidade",
     "rotulo": "1 ha"
    },
    {
     "tipo": "termo",
     "chave": "ha",
     "junto": true
    },
    {
     "tipo": "legenda",
     "t": "Quantos de *1 ha* cabem no quadrado grande? *Chutem!*",
     "junto": true,
     "atraso": 0.3
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "ha"
    },
    {
     "tipo": "quadrado",
     "fase": "marcasTopo",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "r1",
     "regiao": "D",
     "junto": true,
     "atraso": 0.2,
     "linhas": [
      {
       "t": "1 km = 1 000 m",
       "tam": 48,
       "neg": true,
       "y": 245
      }
     ]
    },
    {
     "tipo": "quadrado",
     "fase": "marcasEsq"
    },
    {
     "tipo": "linhas",
     "id": "r2",
     "junto": true,
     "atraso": 0.3,
     "linhas": [
      {
       "t": "1 000 m ÷ 100 m = *10*",
       "tam": 48,
       "neg": true,
       "y": 315
      }
     ]
    },
    {
     "tipo": "legenda",
     "t": "Cada lado tem *10* pedaços de 100 m.",
     "junto": true,
     "atraso": 0.3
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "quadrado",
     "fase": "grade"
    },
    {
     "tipo": "linhas",
     "id": "r3",
     "atraso": -0.2,
     "linhas": [
      {
       "t": "1 quadradinho = 100 m × 100 m",
       "tam": 38,
       "y": 388
      },
      {
       "t": "= 10 000 m² = *1 ha*",
       "tam": 38,
       "y": 434
      }
     ]
    },
    {
     "tipo": "legenda",
     "t": "A grade divide o quadrado grande em *hectares*.",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 1,
   "acoes": [
    {
     "tipo": "quadrado",
     "fase": "contar",
     "x": 880,
     "y": 505
    },
    {
     "tipo": "linhas",
     "id": "r4",
     "linhas": [
      {
       "t": "10 × 10 = *100*",
       "tam": 48,
       "neg": true,
       "y": 568
      }
     ]
    },
    {
     "tipo": "linhas",
     "id": "fato",
     "linhas": [
      {
       "t": "1 km² = 100 ha",
       "tam": 58,
       "cor": "yellow",
       "neg": true,
       "x": 1195,
       "ancora": "meio",
       "y": 666,
       "caixa": true,
       "id": "caixaFato"
      }
     ]
    },
    {
     "tipo": "legenda",
     "t": "*100* hectares cabem em 1 km². Então: *1 km² = 100 ha*.",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 2,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "r1",
      "r2",
      "r3",
      "contador",
      "r4"
     ],
     "dur": 0.3
    },
    {
     "tipo": "mover",
     "alvo": "quadrado",
     "escala": 0.42,
     "x": -90,
     "origem": [
      170,
      210
     ],
     "junto": true
    },
    {
     "tipo": "mover",
     "alvo": "caixaFato",
     "escala": 0.6,
     "para": [
      185,
      482
     ],
     "junto": true
    },
    {
     "tipo": "conta",
     "fase": "entrar",
     "id": "contaA",
     "numero": "468,2",
     "op": "mul",
     "fator": "100",
     "unidadeDe": "km²",
     "unidadePara": "ha",
     "nota": [
      "100 ha em",
      "cada km²"
     ],
     "daFaixa": "fA",
     "resultado": "46820"
    },
    {
     "tipo": "legenda",
     "t": "O número do problema vai para a *conta*.",
     "junto": true
    }
   ]
  },
  {
   "momento": 2,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "Cada km² tem 100 ha. Então multiplicamos: *× 100*."
    },
    {
     "tipo": "conta",
     "fase": "armar",
     "id": "contaA"
    }
   ]
  },
  {
   "momento": 2,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "×100: a vírgula anda *2 casas* para a direita."
    },
    {
     "tipo": "linhas",
     "id": "porque",
     "linhas": [
      {
       "t": "Por quê? ×10 → a vírgula anda *1* casa  ·  ×100 = ×10 × 10 → anda *2* casas",
       "tam": 30,
       "cor": "sky",
       "x": 800,
       "ancora": "meio",
       "y": 715,
       "vel": 1600,
       "maxW": 1400
      }
     ]
    },
    {
     "tipo": "conta",
     "fase": "resolver",
     "id": "contaA"
    }
   ]
  },
  {
   "momento": 2,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "Confere: hectare é *menor* que km², então o número ficou *maior*. ✓"
    },
    {
     "tipo": "cartao",
     "id": "respA",
     "estilo": "ok",
     "x": 1180,
     "y": 160,
     "w": 370,
     "h": 200,
     "rx": 20,
     "entrada": "direita",
     "comVoto": true,
     "atraso": -0.3,
     "linhas": [
      {
       "t": "RESPOSTA",
       "tam": 26,
       "cor": "dim",
       "neg": true,
       "ls": true,
       "dy": 46
      },
      {
       "t": "C  ·  46 820 ha",
       "tam": 42,
       "cor": "ok",
       "neg": true,
       "dy": 98
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "contaA",
      "porque",
      "respA",
      "fA"
     ],
     "dur": 0.4
    },
    {
     "tipo": "faixa",
     "id": "fB",
     "antes": "Sua vez: Jundiaí (SP) tem",
     "numero": "431,2 km²",
     "depois": "→ quantos hectares?"
    },
    {
     "tipo": "conta",
     "fase": "entrar",
     "id": "contaB",
     "numero": "431,2",
     "op": "mul",
     "fator": "100",
     "unidadeDe": "km²",
     "unidadePara": "ha",
     "nota": [
      "100 ha em",
      "cada km²"
     ],
     "daFaixa": "fB",
     "resultado": "43120"
    },
    {
     "tipo": "conta",
     "fase": "armar",
     "id": "contaB"
    },
    {
     "tipo": "conta",
     "fase": "interrogar",
     "id": "contaB"
    },
    {
     "tipo": "legenda",
     "t": "*Sua vez!* Façam no caderno. Depois conferimos.",
     "junto": true
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "conta",
     "fase": "resolver",
     "id": "contaB"
    },
    {
     "tipo": "legenda",
     "t": "Isso! 431,2 × 100 = *43 120 ha* ✓"
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "contaB",
      "fB"
     ],
     "dur": 0.4
    },
    {
     "tipo": "faixa",
     "id": "fC",
     "antes": "Sua vez: plantações em SP:",
     "numero": "2,62 → 2,66 milhões de ha.",
     "depois": "Quanto aumentou?"
    },
    {
     "tipo": "linhas",
     "id": "spEnun",
     "entrada": "sobe",
     "junto": true,
     "atraso": 0.1,
     "linhas": [
      {
       "t": "Em São Paulo, a área plantada passou de:",
       "tam": 40,
       "x": 420,
       "y": 215
      },
      {
       "t": "2023/24 → *2,62 milhões de ha*",
       "tam": 48,
       "x": 420,
       "y": 300
      },
      {
       "t": "2024/25 → *2,66 milhões de ha*",
       "tam": 48,
       "x": 420,
       "y": 372
      },
      {
       "t": "Qual foi o aumento:",
       "tam": 40,
       "x": 420,
       "y": 462
      },
      {
       "t": "a) em hectares?  ·  b) em km²?  ·  c) em m²?",
       "tam": 40,
       "cor": "sky",
       "neg": true,
       "x": 420,
       "y": 526
      }
     ]
    },
    {
     "tipo": "legenda",
     "t": "Do material da Seduc. *Virem e conversem*: como achar o aumento?",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "spEnun"
     ],
     "dur": 0.35
    },
    {
     "tipo": "termo",
     "chave": "milhao",
     "junto": true,
     "atraso": 0.2
    },
    {
     "tipo": "legenda",
     "t": "Antes de calcular: o que quer dizer *milhão*?",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "milhao"
    },
    {
     "tipo": "legenda",
     "t": "*Vírgula embaixo de vírgula.* Subtraímos da direita para a esquerda.",
     "junto": true,
     "atraso": 0.5
    },
    {
     "tipo": "coluna",
     "id": "subA",
     "op": "sub",
     "a": "2,66",
     "b": "2,62",
     "titulo": "Aumento = final − inicial",
     "unidade": "milhão de ha",
     "x": 694,
     "resultado": "0,04"
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "1 milhão = 1 000 000. A vírgula anda *6 casas* para a direita."
    },
    {
     "tipo": "linhas",
     "id": "lnA",
     "linhas": [
      {
       "t": "a) 0,04 milhão de ha:",
       "tam": 34,
       "neg": true,
       "x": 980,
       "y": 205
      },
      {
       "t": "0,04 × 1 000 000 =",
       "tam": 34,
       "x": 980,
       "y": 252
      }
     ]
    },
    {
     "tipo": "virgula",
     "id": "contaSP",
     "numero": "0,04",
     "op": "mul",
     "casas": 6,
     "x": 1000,
     "y": 340,
     "unidade": "ha",
     "nota": "×1 000 000 → a vírgula anda *6* casas",
     "nota2": "Zeros à esquerda não mudam o valor.",
     "resultado": "40000"
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "Lembra? *1 km² = 100 ha*. Então dividimos por 100."
    },
    {
     "tipo": "pulsar",
     "alvo": "caixaFato",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "lnB",
     "linhas": [
      {
       "t": "b) em km²: ha → km² é ÷ 100",
       "tam": 32,
       "neg": true,
       "x": 980,
       "y": 510
      },
      {
       "t": "40 000 ÷ 100 = *400 km²*",
       "tam": 44,
       "x": 980,
       "y": 566
      },
      {
       "t": "÷100 → vírgula anda 2 casas à esquerda",
       "tam": 26,
       "cor": "sky",
       "x": 980,
       "y": 606
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "Truque: 4 × 1 = 4 e juntamos os zeros: 4 + 4 = *8 zeros*."
    },
    {
     "tipo": "linhas",
     "id": "lnC",
     "junto": true,
     "atraso": 0.2,
     "linhas": [
      {
       "t": "c) em m²: 1 ha = 10 000 m²",
       "tam": 32,
       "neg": true,
       "x": 980,
       "y": 662
      },
      {
       "t": "40 000 × 10 000 = *400 000 000 m²*",
       "tam": 30,
       "x": 980,
       "y": 712
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "legenda",
     "t": "Confere: 400 km² × 1 000 000 = *400 000 000 m²* ✓"
    },
    {
     "tipo": "cartao",
     "id": "respSP",
     "estilo": "ok",
     "camada": "painel",
     "x": 400,
     "y": 592,
     "w": 540,
     "h": 132,
     "rx": 18,
     "junto": true,
     "atraso": 0.3,
     "desloc": 20,
     "padX": 28,
     "linhas": [
      {
       "t": "RESPOSTAS",
       "tam": 22,
       "cor": "dim",
       "neg": true,
       "ls": true,
       "dy": 34
      },
      {
       "t": "a) 40 000 ha  ·  b) 400 km²",
       "tam": 30,
       "cor": "ok",
       "neg": true,
       "dy": 74
      },
      {
       "t": "c) 400 000 000 m²",
       "tam": 30,
       "cor": "ok",
       "neg": true,
       "dy": 112
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "subA",
      "lnA",
      "contaSP",
      "lnB",
      "lnC",
      "respSP",
      "fC",
      "quadrado",
      "caixaFato"
     ],
     "dur": 0.45
    },
    {
     "tipo": "faixa",
     "id": "fD",
     "antes": "Desafio UNICAMP 2021:",
     "numero": "área da região sombreada",
     "depois": "— está entre quais valores?"
    },
    {
     "tipo": "figura",
     "id": "figU",
     "origem": [
      110,
      190
     ],
     "escala": 80,
     "junto": true,
     "formas": [
      {
       "tipo": "ret",
       "x": 0,
       "y": 0,
       "w": 5,
       "h": 5,
       "estilo": "sombra"
      },
      {
       "tipo": "ret",
       "x": 5,
       "y": 5,
       "w": 0.5,
       "h": 0.5,
       "estilo": "sombra"
      },
      {
       "tipo": "ret",
       "x": 0,
       "y": 0,
       "w": 5,
       "h": 5,
       "estilo": "celula",
       "oculta": true,
       "id": "hl1"
      },
      {
       "tipo": "ret",
       "x": 5,
       "y": 5,
       "w": 0.5,
       "h": 0.5,
       "estilo": "celula",
       "oculta": true,
       "id": "hl2"
      },
      {
       "tipo": "ret",
       "x": 0,
       "y": 0,
       "w": 5.5,
       "h": 5.5,
       "estilo": "traco"
      },
      {
       "tipo": "linha",
       "x1": 5,
       "y1": 0,
       "x2": 5,
       "y2": 5.5,
       "estilo": "traco"
      },
      {
       "tipo": "linha",
       "x1": 0,
       "y1": 5,
       "x2": 5.5,
       "y2": 5,
       "estilo": "traco"
      },
      {
       "tipo": "circulo",
       "x": 5.25,
       "y": 5.25,
       "raio": 0.6,
       "estilo": "tracoY",
       "id": "anel"
      }
     ],
     "cotas": [
      {
       "de": [
        0,
        0
       ],
       "ate": [
        5,
        0
       ],
       "lado": "cima",
       "texto": "5 cm"
      },
      {
       "de": [
        5,
        5.5
       ],
       "ate": [
        5.5,
        5.5
       ],
       "lado": "baixo",
       "texto": "0,5 cm"
      }
     ]
    },
    {
     "tipo": "alternativas",
     "id": "altU",
     "x": 640,
     "y": 300,
     "w": 430,
     "junto": true,
     "atraso": 0.2,
     "titulo": [
      "A região sombreada é formada por",
      "dois quadrados. Sua área está entre:"
     ],
     "itens": [
      [
       "A",
       "18 cm² e 20 cm²"
      ],
      [
       "B",
       "27 cm² e 29 cm²"
      ],
      [
       "C",
       "25 cm² e 27 cm²"
      ],
      [
       "D",
       "20 cm² e 25 cm²"
      ]
     ]
    },
    {
     "tipo": "legenda",
     "t": "Região sombreada = a parte *pintada*. *Virem e conversem!*",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "altU"
     ],
     "dur": 0.3
    },
    {
     "tipo": "termo",
     "chave": "cm2",
     "junto": true,
     "atraso": 0.1
    },
    {
     "tipo": "legenda",
     "t": "A unidade aqui é o *centímetro quadrado* (cm²).",
     "junto": true,
     "atraso": 0.2
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "guardar",
     "chave": "cm2"
    },
    {
     "tipo": "mostrar",
     "alvo": "hl1",
     "op": 0.5,
     "dur": 0.4
    },
    {
     "tipo": "legenda",
     "t": "Área do quadrado = *lado × lado*.",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "u1",
     "linhas": [
      {
       "t": "Quadrado grande:",
       "tam": 32,
       "cor": "dim",
       "neg": true,
       "x": 640,
       "y": 215
      },
      {
       "t": "5 cm × 5 cm = *25 cm²*",
       "tam": 48,
       "neg": true,
       "x": 640,
       "y": 275
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "mostrar",
     "alvo": "hl1",
     "op": 0,
     "dur": 0.3
    },
    {
     "tipo": "mostrar",
     "alvo": "hl2",
     "op": 0.6,
     "dur": 0.3,
     "junto": true
    },
    {
     "tipo": "tracar",
     "alvo": "anel",
     "dur": 0.6,
     "junto": true
    },
    {
     "tipo": "legenda",
     "t": "Casas decimais = os algarismos *depois da vírgula*.",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "u2",
     "linhas": [
      {
       "t": "Quadrado pequeno:",
       "tam": 32,
       "cor": "dim",
       "neg": true,
       "x": 640,
       "y": 360
      },
      {
       "t": "0,5 cm × 0,5 cm = *0,25 cm²*",
       "tam": 44,
       "neg": true,
       "x": 640,
       "y": 420
      },
      {
       "t": "5 × 5 = 25  ·  casas decimais: 1 + 1 = 2  →  0,25",
       "tam": 26,
       "cor": "sky",
       "x": 640,
       "y": 466
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "anel"
     ],
     "dur": 0.25
    },
    {
     "tipo": "mostrar",
     "alvo": "hl1",
     "op": 0.5,
     "dur": 0.35,
     "junto": true
    },
    {
     "tipo": "mostrar",
     "alvo": "hl2",
     "op": 0.5,
     "dur": 0.35,
     "junto": true
    },
    {
     "tipo": "legenda",
     "t": "Somamos as duas partes *pintadas*.",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "u3",
     "linhas": [
      {
       "t": "Total:",
       "tam": 32,
       "cor": "dim",
       "neg": true,
       "x": 640,
       "y": 545
      },
      {
       "t": "25 + 0,25 = *25,25 cm²*",
       "tam": 48,
       "neg": true,
       "x": 640,
       "y": 605
      },
      {
       "t": "(25 = 25,00 → vírgula embaixo de vírgula)",
       "tam": 26,
       "cor": "sky",
       "x": 640,
       "y": 648
      }
     ]
    }
   ]
  },
  {
   "momento": 3,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "u1",
      "u2"
     ],
     "dur": 0.35
    },
    {
     "tipo": "reta",
     "id": "retaU",
     "x0": 660,
     "x1": 1520,
     "y": 380,
     "min": 18,
     "max": 29,
     "faixas": [
      [
       "A",
       18,
       20
      ],
      [
       "D",
       20,
       25
      ],
      [
       "C",
       25,
       27
      ],
      [
       "B",
       27,
       29
      ]
     ],
     "destaque": [
      25,
      27
     ],
     "ponto": {
      "v": 25.25,
      "texto": "25,25"
     }
    },
    {
     "tipo": "legenda",
     "t": "25,25 fica entre 25 e 27: *alternativa C* ✓",
     "junto": true
    },
    {
     "tipo": "linhas",
     "id": "aviso",
     "linhas": [
      {
       "t": "Cuidado: 25,25 é MAIOR que 25 → não é a D.",
       "tam": 28,
       "cor": "coral",
       "neg": true,
       "x": 640,
       "y": 500
      }
     ]
    }
   ]
  },
  {
   "momento": 4,
   "acoes": [
    {
     "tipo": "sai",
     "alvos": [
      "figU",
      "u3",
      "retaU",
      "fD"
     ],
     "dur": 0.45
    },
    {
     "tipo": "cartao",
     "id": "regra",
     "estilo": "box",
     "camada": "fecho",
     "x": 80,
     "y": 150,
     "w": 680,
     "h": 570,
     "rx": 26,
     "padX": 40,
     "linhas": [
      {
       "t": "REGRA DE HOJE",
       "tam": 38,
       "cor": "yellow",
       "neg": true,
       "ls": true,
       "dy": 68
      },
      {
       "t": "km²  →  ha",
       "tam": 66,
       "neg": true,
       "dy": 168
      },
      {
       "t": "multiplique por 100",
       "tam": 40,
       "cor": "sky",
       "dy": 222
      },
      {
       "t": "ha  →  km²",
       "tam": 66,
       "neg": true,
       "dy": 328
      },
      {
       "t": "divida por 100",
       "tam": 40,
       "cor": "sky",
       "dy": 382
      },
      {
       "t": "Porque 1 km² = 100 ha.",
       "tam": 36,
       "cor": "dim",
       "dy": 490
      }
     ]
    },
    {
     "tipo": "cartao",
     "id": "pega",
     "estilo": "coral",
     "camada": "fecho",
     "x": 840,
     "y": 150,
     "w": 680,
     "h": 570,
     "rx": 26,
     "padX": 40,
     "atraso": 0.25,
     "linhas": [
      {
       "t": "CUIDADO: PEGADINHA",
       "tam": 38,
       "cor": "coral",
       "neg": true,
       "ls": true,
       "dy": 68
      },
      {
       "t": "Hectare não é metro quadrado!",
       "tam": 35,
       "neg": true,
       "dy": 134
      },
      {
       "t": "468,2 km² = 468 200 000 m²",
       "tam": 38,
       "dy": 200
      },
      {
       "t": "Essa é a alternativa D: está em m²,",
       "tam": 30,
       "cor": "dim",
       "dy": 248
      },
      {
       "t": "não em hectares.",
       "tam": 30,
       "cor": "dim",
       "dy": 286
      },
      {
       "t": "Por quê? 1 km² = 1 000 m × 1 000 m",
       "tam": 32,
       "dy": 360
      },
      {
       "t": "= 1 000 000 m²",
       "tam": 32,
       "dy": 402
      },
      {
       "t": "Confere: 100 ha × 10 000 m²",
       "tam": 30,
       "cor": "ok",
       "dy": 476
      },
      {
       "t": "= 1 000 000 m² = 1 km² ✓",
       "tam": 30,
       "cor": "ok",
       "dy": 516
      }
     ]
    },
    {
     "tipo": "assinatura",
     "atraso": 0.3
    },
    {
     "tipo": "legenda",
     "t": "Palavras da aula aqui embaixo: *toquem para rever*.",
     "junto": true
    }
   ]
  }
 ]
};
