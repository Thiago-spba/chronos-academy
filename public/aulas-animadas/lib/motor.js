/* ==========================================================================
   Motor das aulas animadas do Chronos (quadro passo a passo).
   - Lê os dados de uma aula (window.CHRONOS_AULA, em /aulas-animadas/dados/<id>.js)
   - Monta uma única linha do tempo (GSAP) com um rótulo por clique (b0, b1, ...)
   - Cada "peça" (pergunta, termo, conta com vírgula, coluna, figura...) sabe
     desenhar e animar sozinha. A IA só escolhe peças e preenche o conteúdo:
     ela nunca posiciona nem desenha nada.
   - As contas são calculadas AQUI (não pela IA); se o resultado informado
     nos dados não bater com o calculado, o erro fica em window.__aula.erros.
   ========================================================================== */
(function(){
'use strict';
var NS = 'http://www.w3.org/2000/svg';
var svg = null;
function $(id){ return document.getElementById(id); }
function el(tag, attrs, parent){
  var e = document.createElementNS(NS, tag);
  if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}
// *palavra* = destaque em amarelo
function txt(str, attrs, parent){
  var t = el('text', attrs, parent);
  String(str).split('*').forEach(function(p, i){
    if (!p) return;
    if (i % 2){ var s = el('tspan', {'class':'c-yellow b'}, t); s.textContent = p; }
    else t.appendChild(document.createTextNode(p));
  });
  return t;
}
var COR = {chalk:'c-chalk', dim:'c-dim', sky:'c-sky', yellow:'c-yellow', ok:'c-ok', coral:'c-coral', board:'c-board'};
function cls(l){ return (COR[l.cor || 'chalk'] || 'c-chalk') + (l.neg ? ' b' : '') + (l.ls ? ' ls' : ''); }

/* ---------- aritmética decimal exata (sem ponto flutuante) ---------- */
// "468,2" -> {n: 4682n, c: 1}  (valor = n / 10^c). Aceita espaços como separador de milhar.
function lerDec(s){
  var t = String(s).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  var m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t);
  if (!m) throw new Error('Número inválido: ' + s);
  var c = (m[3] || '').length;
  var n = BigInt(m[2] + (m[3] || ''));
  return {n: m[1] ? -n : n, c: c};
}
function igualaCasas(a, b){
  var c = Math.max(a.c, b.c);
  return [a.n * (10n ** BigInt(c - a.c)), b.n * (10n ** BigInt(c - b.c)), c];
}
function escalar(d, k){ // valor × 10^k, exato
  if (d.c - k >= 0) return {n:d.n, c:d.c - k};
  return {n:d.n * (10n ** BigInt(k - d.c)), c:0};
}
function fmtDec(n, c){
  var neg = n < 0n; if (neg) n = -n;
  var s = n.toString();
  if (c > 0){ while (s.length <= c) s = '0' + s; }
  var ip = c > 0 ? s.slice(0, s.length - c) : s;
  var fp = c > 0 ? s.slice(s.length - c) : '';
  fp = fp.replace(/0+$/, '');
  return (neg ? '-' : '') + ip + (fp ? ',' + fp : '');
}
function fmtMilhar(s){
  var p = String(s).split(',');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return p.join(',');
}
function normNum(s){ return String(s).replace(/[\s ]/g, ''); }

function erro(t1, t2){
  svg = $('cena');
  if (!svg) return;
  if (window.CHRONOS_TEMAS) aplicarTema(0);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  txt(t1, {x:800, y:430, 'text-anchor':'middle', 'font-size':44, 'class':'c-chalk'});
  txt(t2, {x:800, y:490, 'text-anchor':'middle', 'font-size':32, 'class':'c-dim'});
  $('btnAvancar').disabled = true; $('btnVoltar').disabled = true;
  ligarFechar();
}
function ligarFechar(){
  var f = $('btnFechar');
  if (f) f.addEventListener('click', function(){ if (window.history.length > 1) window.history.back(); else window.location.href = '/'; });
}

/* ---------- temas ---------- */
function claro(hex){ var n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 150; }
function aplicarTema(i){
  var TEMAS = window.CHRONOS_TEMAS;
  i = (i % TEMAS.length + TEMAS.length) % TEMAS.length;
  var t = TEMAS[i], r = document.documentElement.style;
  [['--board',t.bg],['--g1',t.g1],['--g2',t.g2],['--board2',t.card],['--chalk',t.chalk],['--dim',t.dim],
   ['--yellow',t.a1],['--sky',t.a2],['--coral',t.coral],['--ok',t.ok],['--line',t.line]].forEach(function(p){ r.setProperty(p[0], p[1]); });
  r.setProperty('color-scheme', claro(t.bg) ? 'light' : 'dark');
  return i;
}

function iniciar(AULA, temaIdx){
  svg = $('cena');
  var btnAvancar = $('btnAvancar'), btnVoltar = $('btnVoltar');
  ligarFechar();
  aplicarTema(temaIdx || 0);
  if (!window.gsap){ erro('Não foi possível carregar a animação.', 'Verifique a internet e recarregue a página.'); return; }
  if (!AULA || !Array.isArray(AULA.passos) || !AULA.passos.length){ erro('Esta aula está incompleta.', 'Avise o professor.'); return; }
  document.title = (AULA.titulo || 'Aula') + ' · Chronos Academy';
  svg.setAttribute('aria-label', 'Quadro da aula ' + (AULA.titulo || ''));

  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pronto = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise(function(r){ setTimeout(r, 2500); })])
    : Promise.resolve();
  pronto.then(function(){ construir(AULA, reduz); });

  function construir(AULA, reduz){
    var ERROS = [];
    function falha(msg){ ERROS.push(msg); if (window.console) console.error('[aula] ' + msg); }
    var MOMENTOS = AULA.momentos || ['Curiosidade','Ver','Montar','Sua vez','Fechamento'];
    var MOMENTO_DO_PASSO = [0], momentoAtual = 0;

    // ---------- camadas ----------
    var defs = el('defs');
    var grad = el('radialGradient', {id:'giz', cx:'50%', cy:'45%', r:'75%'}, defs);
    el('stop', {offset:'0%', style:'stop-color:var(--g1)'}, grad);
    el('stop', {offset:'100%', style:'stop-color:var(--g2)'}, grad);
    el('rect', {x:0, y:0, width:1600, height:900, rx:22, fill:'url(#giz)'});
    var L = {};
    ['quadro','painel','conta','faixa','cards','fecho','topo','legenda','chips','popup'].forEach(function(n){ L[n] = el('g'); });

    var tl = gsap.timeline({paused:true});
    var nPasso = 0;
    tl.addLabel('b0', 0);
    function fimPasso(){ MOMENTO_DO_PASSO.push(momentoAtual); nPasso++; var t = tl.duration(); tl.addLabel('b' + nPasso, t); tl.set({}, {}, t); }

    // ---------- utilidades de animação ----------
    function oculto(e){ gsap.set(e, {opacity:0}); return e; }
    function aparecer(e, pos, d){ tl.to(e, {opacity:1, duration:d || .45}, pos); }
    function sumir(e, pos, d){ tl.to(e, {opacity:0, duration:d || .3}, pos); }
    var nClip = 0;
    function escrever(t, pos, vel){ // efeito de "escrever com giz"
      var bb = t.getBBox();
      var id = 'cl' + (++nClip);
      var cp = el('clipPath', {id:id, clipPathUnits:'userSpaceOnUse'}, defs);
      var r = el('rect', {x:bb.x - 8, y:bb.y - 14, width:0, height:bb.height + 28}, cp);
      t.setAttribute('clip-path', 'url(#' + id + ')');
      var w = bb.width + 16;
      tl.to(r, {attr:{width:w}, duration:Math.max(.35, w / (vel || 1000)), ease:'none'}, pos);
    }
    function tracar(e, pos, d){
      var len = e.getTotalLength();
      e.style.strokeDasharray = len; e.style.strokeDashoffset = len;
      tl.to(e, {strokeDashoffset:0, duration:d || .6, ease:'power1.inOut'}, pos);
    }
    function P_(a){ return (a.junto ? '<' : '>') + (a.atraso != null ? String(a.atraso) : ''); }
    var legAtual = null;
    function legenda(str, pos){
      var t = txt(str, {x:800, y:782, 'text-anchor':'middle', 'font-size':40, 'class':'c-chalk'}, L.legenda);
      if (legAtual){ sumir(legAtual, pos, .2); pos = '>'; }
      escrever(t, pos, 1500);
      legAtual = t;
      return t;
    }

    // ---------- objetos nomeados (para "sai", "mover" etc.) ----------
    var O = {};
    function obj(id){ if (!O[id]) throw new Error('Objeto inexistente: ' + id); return O[id]; }

    // ---------- topo: título + momentos ----------
    txt(AULA.titulo || '', {x:60, y:66, 'font-size':34, 'class':'c-chalk b'}, L.topo);
    var momEls = MOMENTOS.map(function(m, i){ return txt((i + 1) + '  ' + m, {x:0, y:66, 'font-size':25, 'class':'c-dim'}, L.topo); });
    var totalW = momEls.reduce(function(s, e){ return s + e.getBBox().width; }, 0) + 34 * (momEls.length - 1);
    var mx = 1540 - totalW;
    momEls.forEach(function(e){ e.setAttribute('x', mx); mx += e.getBBox().width + 34; });

    // ---------- barra de palavras (glossário) ----------
    var termos = AULA.termos || {};
    var chipsLabel = oculto(txt('Palavras da aula:', {x:60, y:855, 'font-size':26, 'class':'c-dim'}, L.chips));
    var chipX = 60 + chipsLabel.getBBox().width + 22;
    var chips = {}, chipsLabelMostrado = false;
    var ordemChips = AULA.ordemChips || Object.keys(termos);
    ordemChips.forEach(function(k){
      var g = el('g', {'class':'chip'}, L.chips);
      var r = el('rect', {x:chipX, y:822, width:10, height:48, rx:24}, g);
      var t = txt(termos[k].chip, {x:0, y:855, 'font-size':27, 'class':'c-chalk b', 'text-anchor':'middle'}, g);
      var w = t.getBBox().width + 48;
      r.setAttribute('width', w);
      t.setAttribute('x', chipX + w / 2);
      chips[k] = {g:g, cx:chipX + w / 2, cy:846};
      chipX += w + 16;
      oculto(g);
      g.addEventListener('click', function(ev){ ev.stopPropagation(); abrirPopup(k); });
    });

    // ---------- cartões de definição ----------
    var cards = {};
    Object.keys(termos).forEach(function(k){
      var def = termos[k];
      var g = el('g', {}, L.cards);
      el('rect', {x:860, y:150, width:680, height:560, rx:26, 'class':'card-box'}, g);
      var y = 222;
      var tit = txt(def.titulo, {x:900, y:y, 'font-size':42, 'class':'c-yellow b'}, g);
      var tw0 = tit.getBBox().width;
      if (tw0 > 600) tit.setAttribute('font-size', Math.floor(42 * 600 / tw0));
      y += 22;
      def.secoes.forEach(function(s){
        y += 48; txt(s.rotulo, {x:900, y:y, 'font-size':23, 'class':'c-sky b ls'}, g);
        s.linhas.forEach(function(l){ y += 46; txt(l, {x:900, y:y, 'font-size':35, 'class':'c-chalk'}, g); });
        y += 8;
      });
      cards[k] = oculto(g);
    });
    function cartaoEntra(k, pos){
      gsap.set(cards[k], {scale:.9, transformOrigin:'50% 50%'});
      tl.to(cards[k], {opacity:1, scale:1, duration:.55, ease:'back.out(1.5)'}, pos);
    }
    function cartaoVaiParaPalavras(k, pos){
      var c = chips[k];
      tl.to(cards[k], {x:c.cx - 1200, y:c.cy - 430, scale:.1, opacity:0, duration:.75, ease:'power2.inOut'}, pos);
      if (!chipsLabelMostrado){ chipsLabelMostrado = true; aparecer(chipsLabel, '<.4', .3); }
      aparecer(c.g, '<.45', .3);
      tl.fromTo(c.g, {scale:1.25, transformOrigin:'50% 50%'}, {scale:1, duration:.4, ease:'back.out(2)'}, '<');
    }
    var popupAberto = false;
    function abrirPopup(k){
      fecharPopup();
      el('rect', {x:0, y:0, width:1600, height:900, style:'fill:var(--g2)', opacity:.92}, L.popup);
      var clone = cards[k].cloneNode(true);
      clone.removeAttribute('style');
      clone.setAttribute('transform', 'translate(-400,20)');
      L.popup.appendChild(clone);
      txt('Toque em qualquer lugar para fechar', {x:800, y:800, 'text-anchor':'middle', 'font-size':28, 'class':'c-dim'}, L.popup);
      gsap.fromTo(L.popup, {opacity:0}, {opacity:1, duration:.25});
      popupAberto = true;
    }
    function fecharPopup(){ while (L.popup.firstChild) L.popup.removeChild(L.popup.firstChild); popupAberto = false; }
    L.popup.addEventListener('click', function(ev){ ev.stopPropagation(); fecharPopup(); });

    // ---------- estado compartilhado ----------
    var atual = 0;
    var voto = null, perguntaEst = null, contadores = [], votoEls = null;
    var REG = {D:{x:880, y:215, w:660}, E:{x:100, y:215, w:700}, T:{x:100, y:215, w:1400}};
    var cursor = {D:215, E:215, T:215};

    var PECAS = {};

    /* ==================================================================
       PEÇAS GERAIS
       ================================================================== */
    function pos1(a, b){ return P_(a); }

    // {tipo:'sai', alvos:['id',...], efeito:'sobe'|'some'}
    PECAS.sai = function(a){
      (a.alvos || []).forEach(function(id, i){
        var o = obj(id), pos = i === 0 ? P_(a) : '<';
        if (o.sair) o.sair(pos, a);
        else {
          var v = {opacity:0, duration:a.dur || .3};
          if (a.efeito === 'sobe'){ v.y = -30; v.duration = a.dur || .45; }
          tl.to(o.g, v, pos);
        }
      });
    };
    // {tipo:'mover', alvo, escala, x, y, origem:[x,y]} ou {alvo, escala, para:[cx,cy]}
    PECAS.mover = function(a){
      var o = obj(a.alvo), v = {duration:a.dur || .9, ease:'power2.inOut'};
      if (a.escala != null) v.scale = a.escala;
      if (a.para){
        var bb = o.g.getBBox();
        v.x = a.para[0] - (bb.x + bb.width / 2); v.y = a.para[1] - (bb.y + bb.height / 2);
        v.transformOrigin = '50% 50%';
      } else {
        if (a.x != null) v.x = a.x;
        if (a.y != null) v.y = a.y;
        if (a.origem) v.svgOrigin = a.origem[0] + ' ' + a.origem[1]; else v.transformOrigin = '50% 50%';
      }
      tl.to(o.g, v, P_(a));
    };
    // {tipo:'pulsar', alvo}: lembra o aluno de um fato já escrito
    PECAS.pulsar = function(a){
      tl.to(obj(a.alvo).g, {scale:a.escala || .75, transformOrigin:'50% 50%', duration:.3, yoyo:true, repeat:1, ease:'power1.inOut'}, P_(a));
    };
    // {tipo:'mostrar', alvo, op}
    PECAS.mostrar = function(a){ tl.to(obj(a.alvo).g, {opacity:a.op != null ? a.op : 1, duration:a.dur || .4}, P_(a)); };
    // {tipo:'tracar', alvo}
    PECAS.tracar = function(a){ var o = obj(a.alvo); tracar(o.tr || o.g, P_(a), a.dur || .6); };
    // {tipo:'legenda', t}
    PECAS.legenda = function(a){ legenda(a.t, P_(a)); };

    // {tipo:'termo', chave} / {tipo:'guardar', chave}
    PECAS.termo = function(a){ if (!cards[a.chave]) throw new Error('Termo inexistente: ' + a.chave); cartaoEntra(a.chave, P_(a)); };
    PECAS.guardar = function(a){ if (!chips[a.chave]) throw new Error('Termo inexistente: ' + a.chave); cartaoVaiParaPalavras(a.chave, P_(a)); };

    // {tipo:'pergunta', antes, destaque, depois, alternativas:[...], correta}  (só no estado inicial)
    PECAS.pergunta = function(a){
      var g = el('g', {}, L.painel); O[a.id || 'pergunta'] = {g:g};
      txt(a.antes, {x:800, y:212, 'text-anchor':'middle', 'font-size':52, 'class':'c-chalk'}, g);
      txt(a.destaque, {x:800, y:318, 'text-anchor':'middle', 'font-size':104, 'class':'c-yellow b'}, g);
      txt(a.depois, {x:800, y:398, 'text-anchor':'middle', 'font-size':52, 'class':'c-chalk'}, g);
      var altsG = el('g', {}, g), rects = [];
      var LETRAS = 'ABCD';
      (a.alternativas || []).slice(0, 4).forEach(function(t, i){
        var x = 180 + (i % 2) * 640, y = 452 + Math.floor(i / 2) * 110;
        var ga = el('g', {'class':'alt'}, altsG);
        rects.push(el('rect', {x:x, y:y, width:600, height:92, rx:18, 'class':'alt-box'}, ga));
        el('circle', {cx:x + 52, cy:y + 46, r:28, 'class':'alt-circ'}, ga);
        txt(LETRAS[i], {x:x + 52, y:y + 57, 'text-anchor':'middle', 'font-size':32, 'class':'c-board b'}, ga);
        var tt = txt(t, {x:x + 110, y:y + 61, 'font-size':44, 'class':'c-chalk'}, ga);
        var w = tt.getBBox().width; if (w > 470) tt.setAttribute('font-size', Math.floor(44 * 470 / w));
        ga.addEventListener('click', function(ev){ ev.stopPropagation(); if (atual !== 0) return; voto = i; marcarVoto(); });
      });
      perguntaEst = {altsG:altsG, rects:rects, correta:a.correta, letras:LETRAS};
      if (!/^[0-3]$/.test(String(a.correta))) falha('pergunta: "correta" deve ser 0 a 3');
    };
    function marcarVoto(){ if (!perguntaEst) return; perguntaEst.rects.forEach(function(r, j){ r.classList.toggle('sel', j === voto); }); }

    // faixa do problema (fica no alto enquanto trabalhamos)
    // {tipo:'faixa', id, antes, numero, depois}
    PECAS.faixa = function(a){
      var g = el('g', {}, L.faixa);
      var t1 = txt(a.antes, {x:60, y:122, 'font-size':32, 'class':'c-dim'}, g);
      var n = txt(a.numero, {x:0, y:122, 'font-size':32, 'class':'c-yellow b'}, g);
      var c = txt(a.depois, {x:0, y:122, 'font-size':32, 'class':'c-dim'}, g);
      var x = 60 + t1.getBBox().width + 12; n.setAttribute('x', x);
      c.setAttribute('x', x + n.getBBox().width + 12);
      oculto(g);
      O[a.id] = {g:g, numX:x, numero:a.numero};
      aparecer(g, P_(a), .5);
    };

    // {tipo:'linhas', id?, regiao:'D'|'E'|'T', linhas:[{t, tam, cor, neg, ls, x, y, ancora, id, caixa}], reiniciar}
    PECAS.linhas = function(a){
      var rn = a.regiao || 'D', reg = REG[rn];
      if (a.reiniciar) cursor[rn] = reg.y - 25;
      var g = el('g', {}, L.painel);
      if (a.id) O[a.id] = {g:g};
      (a.linhas || []).forEach(function(l, i){
        var tam = l.tam || 44, anc = l.ancora || 'inicio';
        var y;
        if (l.y != null){ y = l.y; cursor[rn] = y + tam * .35; }
        else { y = cursor[rn] + tam * 1.15; cursor[rn] = y + tam * .35; }
        var x = l.x != null ? l.x : (anc === 'meio' ? reg.x + reg.w / 2 : reg.x);
        var pg = g;
        if (l.id){ pg = el('g', {}, g); O[l.id] = {g:pg}; }
        var t = txt(l.t, {x:x, y:y, 'font-size':tam, 'text-anchor':anc === 'meio' ? 'middle' : (anc === 'fim' ? 'end' : 'start'), 'class':cls(l)}, pg);
        var bb = t.getBBox();
        var maxW = l.maxW || (anc === 'inicio' ? Math.max(200, 1540 - x) : reg.w);
        if (bb.width > maxW){ t.setAttribute('font-size', Math.floor(tam * maxW / bb.width)); bb = t.getBBox(); }
        var pos = i === 0 ? P_(a) : '>';
        if (a.entrada === 'sobe') return;
        if (l.caixa){
          var r = el('rect', {x:bb.x - 40, y:bb.y - 12, width:bb.width + 80, height:bb.height + 24, rx:16, 'class':'traco-y'}, pg);
          if (l.id) O[l.id].tr = r;
          tracar(r, pos, .5);
          escrever(t, '<.1');
        } else escrever(t, pos, l.vel);
      });
      if (a.entrada === 'sobe'){
        oculto(g);
        gsap.set(g, {y:24});
        tl.to(g, {opacity:1, y:0, duration:.55, ease:'power2.out'}, P_(a));
      }
    };

    // {tipo:'cartao', id, estilo:'ok'|'coral'|'box', x, y, w, h, linhas:[{t,tam,cor,neg,ls,dy,dx}], entrada:'sobe'|'direita', comVoto}
    PECAS.cartao = function(a){
      var g = el('g', {}, L[a.camada || 'conta']);
      if (a.id) O[a.id] = {g:g};
      var classe = {ok:'card-ok', coral:'card-coral', box:'card-box'}[a.estilo || 'box'];
      var x = a.x != null ? a.x : 860, y = a.y != null ? a.y : 160, w = a.w || 680;
      var rect = el('rect', {x:x, y:y, width:w, height:a.h || 200, rx:a.rx || 22, 'class':classe}, g);
      var yy = y + 20, ultimo = y + 20;
      (a.linhas || []).forEach(function(l){
        var tam = l.tam || 36;
        yy = l.dy != null ? y + l.dy : yy + tam * 1.35;
        var t = txt(l.t, {x:x + (l.dx != null ? l.dx : (a.padX || 32)), y:yy, 'font-size':tam, 'class':cls(l)}, g);
        var bb = t.getBBox(), maxW = w - 50;
        if (bb.width > maxW) t.setAttribute('font-size', Math.floor(tam * maxW / bb.width));
        ultimo = yy;
      });
      if (a.comVoto){
        var y1 = ultimo + 44, y2 = y1 + 36;
        votoEls = {
          l1: txt('', {x:x + 32, y:y1, 'font-size':27, 'class':'c-chalk'}, g),
          l2: txt('', {x:x + 32, y:y2, 'font-size':27, 'class':'c-chalk b'}, g)
        };
        ultimo = y2;
      }
      if (!a.h) rect.setAttribute('height', ultimo - y + 34);
      oculto(g);
      var e = a.entrada || 'sobe';
      var de = e === 'direita' ? {opacity:0, x:40} : {opacity:0, y:a.desloc || 30};
      var para = e === 'direita' ? {opacity:1, x:0, duration:a.dur || .55, ease:'power2.out'} : {opacity:1, y:0, duration:a.dur || .55, ease:'power2.out'};
      tl.fromTo(g, de, para, P_(a));
    };

    /* ==================================================================
       PEÇAS DE FIGURAS
       ================================================================== */
    // {tipo:'contagem', linhas, colunas, tam, x, y}: quadradinhos numerados (ideia de "área")
    PECAS.contagem = function(a){
      var g = el('g', {}, L.quadro), qs = [];
      var tam = a.tam || 100, x0 = a.x != null ? a.x : 220, y0 = a.y != null ? a.y : 310;
      var nl = a.linhas || 3, nc = a.colunas || 4;
      for (var r = 0; r < nl; r++) for (var c = 0; c < nc; c++){
        var gq = el('g', {}, g);
        el('rect', {x:x0 + c * tam, y:y0 + r * tam, width:tam, height:tam, 'class':'quad-area'}, gq);
        txt(String(r * nc + c + 1), {x:x0 + c * tam + tam / 2, y:y0 + r * tam + tam * .62, 'text-anchor':'middle', 'font-size':Math.round(tam * .38), 'class':'c-yellow b'}, gq);
        qs.push(oculto(gq));
      }
      gsap.set(qs, {scale:.5, transformOrigin:'50% 50%'});
      tl.to(qs, {opacity:1, scale:1, duration:.3, stagger:.14, ease:'back.out(2)'}, P_(a));
      O[a.id || 'contagem'] = {g:g, sair:function(pos){ tl.to(qs, {opacity:0, scale:.6, duration:.35, stagger:.03}, pos); }};
    };

    // Quadrado de unidades: 1 m -> cresce até 1 km -> hectare -> marcas -> grade -> contagem
    // {tipo:'quadrado', id, fase:'criar'|'crescer'|'unidade'|'marcasTopo'|'marcasEsq'|'grade'|'contar', ...}
    PECAS.quadrado = function(a){
      var id = a.id || 'quadrado', Q = O[id], fase = a.fase;
      if (!Q){ Q = O[id] = {g:el('g', {}, L.quadro), X0:170, Y0:210, S:500, n:10}; }
      var X0 = Q.X0, Y0 = Q.Y0, S = Q.S;
      if (fase === 'criar'){
        Q.rect = el('rect', {x:350, y:390, width:140, height:140, 'class':'traco'}, Q.g);
        Q.mTop = oculto(txt(a.lado, {x:420, y:374, 'text-anchor':'middle', 'font-size':34, 'class':'c-sky b'}, Q.g));
        Q.mEsq = oculto(txt(a.lado, {x:328, y:460, 'text-anchor':'middle', 'font-size':34, 'class':'c-sky b', transform:'rotate(-90 328 460)'}, Q.g));
        Q.mCen = oculto(txt(a.area, {x:420, y:474, 'text-anchor':'middle', 'font-size':44, 'class':'c-yellow b'}, Q.g));
        tracar(Q.rect, P_(a), .8);
        aparecer([Q.mTop, Q.mEsq], '>-.2');
        aparecer(Q.mCen, '>');
      } else if (fase === 'crescer'){
        Q.n = a.partes || 10;
        Q.kTop = oculto(txt(a.lado, {x:X0 + S / 2, y:166, 'text-anchor':'middle', 'font-size':36, 'class':'c-sky b'}, Q.g));
        Q.kEsq = oculto(txt(a.lado, {x:96, y:Y0 + S / 2, 'text-anchor':'middle', 'font-size':36, 'class':'c-sky b', transform:'rotate(-90 96 ' + (Y0 + S / 2) + ')'}, Q.g));
        Q.kCen = oculto(txt(a.area, {x:X0 + S / 2, y:Y0 + S / 2 + 22, 'text-anchor':'middle', 'font-size':64, 'class':'c-yellow b'}, Q.g));
        sumir([Q.mTop, Q.mEsq, Q.mCen], P_(a));
        tl.set(Q.rect, {strokeDasharray:'none'}, '<');
        tl.to(Q.rect, {attr:{x:X0, y:Y0, width:S, height:S}, duration:1.1, ease:'power3.inOut'}, '<.2');
        aparecer([Q.kTop, Q.kEsq], '>-.3');
        aparecer(Q.kCen, '<.2');
      } else if (fase === 'unidade'){
        var P = S / Q.n;
        Q.haQ = oculto(el('rect', {x:X0, y:Y0, width:P, height:P, 'class':'celula'}, Q.g));
        Q.haLbl = oculto(txt(a.rotulo, {x:X0 + P + 14, y:Y0 + 36, 'font-size':30, 'class':'c-yellow b'}, Q.g));
        tl.fromTo(Q.haQ, {opacity:0, scale:2.2, transformOrigin:'50% 50%'}, {opacity:.8, scale:1, duration:.6, ease:'back.out(1.8)'}, P_(a));
        aparecer(Q.haLbl, '<.3');
      } else if (fase === 'marcasTopo'){
        var P2 = S / Q.n;
        Q.nTop = []; Q.nEsq = []; Q.mkTop = []; Q.mkEsq = [];
        for (var k = 0; k < Q.n; k++){
          Q.nTop.push(oculto(txt(String(k + 1), {x:X0 + k * P2 + P2 / 2, y:Y0 - 12, 'text-anchor':'middle', 'font-size':24, 'class':'c-chalk b'}, Q.g)));
          Q.nEsq.push(oculto(txt(String(k + 1), {x:X0 - 12, y:Y0 + k * P2 + P2 / 2 + 8, 'text-anchor':'end', 'font-size':24, 'class':'c-chalk b'}, Q.g)));
          if (k > 0){
            Q.mkTop.push(oculto(el('line', {x1:X0 + k * P2, y1:Y0 - 10, x2:X0 + k * P2, y2:Y0 + 10, 'class':'traco-y'}, Q.g)));
            Q.mkEsq.push(oculto(el('line', {x1:X0 - 10, y1:Y0 + k * P2, x2:X0 + 10, y2:Y0 + k * P2, 'class':'traco-y'}, Q.g)));
          }
        }
        sumir(Q.kCen, P_(a), .3);
        tl.to(Q.nTop, {opacity:1, duration:.2, stagger:.13}, '>');
        tl.to(Q.mkTop, {opacity:1, duration:.2, stagger:.13}, '<.1');
      } else if (fase === 'marcasEsq'){
        tl.to(Q.nEsq, {opacity:1, duration:.2, stagger:.08}, P_(a));
        tl.to(Q.mkEsq, {opacity:1, duration:.2, stagger:.08}, '<');
      } else if (fase === 'grade'){
        var P3 = S / Q.n, linhas = [];
        for (var j = 1; j < Q.n; j++) linhas.push(el('line', {x1:X0 + j * P3, y1:Y0, x2:X0 + j * P3, y2:Y0 + S, 'class':'traco-fino'}, Q.g));
        for (var j2 = 1; j2 < Q.n; j2++) linhas.push(el('line', {x1:X0, y1:Y0 + j2 * P3, x2:X0 + S, y2:Y0 + j2 * P3, 'class':'traco-fino'}, Q.g));
        sumir(Q.haLbl, P_(a), .25);
        linhas.forEach(function(ln, i){ tracar(ln, i === 0 ? '<' : '<.07', .35); });
      } else if (fase === 'contar'){
        var P4 = S / Q.n, celulas = [];
        for (var cr = 0; cr < Q.n; cr++) for (var cc = 0; cc < Q.n; cc++){
          if (cr === 0 && cc === 0) continue; // a primeira já está acesa (unidade)
          celulas.push(oculto(el('rect', {x:X0 + cc * P4 + 3, y:Y0 + cr * P4 + 3, width:P4 - 6, height:P4 - 6, rx:3, 'class':'celula'}, Q.g)));
        }
        var gc = el('g', {}, L.painel);
        var contador = oculto(txt('Contando: 1', {x:a.x != null ? a.x : 880, y:a.y != null ? a.y : 505, 'font-size':44, 'class':'c-sky b'}, gc));
        O[a.idContador || 'contador'] = {g:gc};
        var cont = {v:1}, total = Q.n * Q.n;
        aparecer(contador, P_(a), .25);
        tl.to(celulas, {opacity:.45, duration:.18, stagger:.024}, '>');
        tl.to(cont, {v:total, duration:celulas.length * .024 + .18, ease:'none', onUpdate:function(){ contador.textContent = 'Contando: ' + Math.round(cont.v); }}, '<');
        contadores.push({el:contador, total:total, passoFim:nPasso + 1});
      } else falha('quadrado: fase desconhecida ' + fase);
    };

    // Figura em escala (formas + medidas). Coordenadas em unidades (ex.: cm), y para baixo.
    // {tipo:'figura', id, origem:[px,py], escala:px por unidade, formas:[{tipo:'ret'|'linha'|'poli', ..., estilo, id, oculta}], cotas:[{de:[x,y], ate:[x,y], lado:'cima'|'baixo'|'esq'|'dir', texto}]}
    var ESTILO = {sombra:'sombra', celula:'celula', traco:'traco', tracoY:'traco-y', fino:'traco-fino', area:'quad-area'};
    PECAS.figura = function(a){
      var g = el('g', {}, L.painel), K = a.escala || 80, ox = a.origem ? a.origem[0] : 110, oy = a.origem ? a.origem[1] : 190;
      O[a.id || 'figura'] = {g:g};
      function X(u){ return ox + u * K; } function Y(u){ return oy + u * K; }
      (a.formas || []).forEach(function(f){
        var e, c = ESTILO[f.estilo || 'traco'] || 'traco';
        if (f.tipo === 'ret') e = el('rect', {x:X(f.x), y:Y(f.y), width:f.w * K, height:f.h * K, 'class':c}, g);
        else if (f.tipo === 'linha') e = el('line', {x1:X(f.x1), y1:Y(f.y1), x2:X(f.x2), y2:Y(f.y2), 'class':c}, g);
        else if (f.tipo === 'poli') e = el('polygon', {points:f.pontos.map(function(p){ return X(p[0]) + ',' + Y(p[1]); }).join(' '), 'class':c}, g);
        else if (f.tipo === 'circulo') e = el('circle', {cx:X(f.x), cy:Y(f.y), r:(f.raio || .5) * K, 'class':c}, g);
        else { falha('figura: forma desconhecida ' + f.tipo); return; }
        if (f.oculta) oculto(e);
        if (f.id) O[f.id] = {g:e, tr:e};
      });
      (a.cotas || []).forEach(function(ct){
        var x1 = X(ct.de[0]), y1 = Y(ct.de[1]), x2 = X(ct.ate[0]), y2 = Y(ct.ate[1]);
        var seta = function(px, py, dx, dy){ // ponta de seta apontando na direção (dx,dy)
          var nx = -dy, ny = dx;
          return px + ',' + py + ' ' + (px - dx * 12 + nx * 7) + ',' + (py - dy * 12 + ny * 7) + ' ' + (px - dx * 12 - nx * 7) + ',' + (py - dy * 12 - ny * 7);
        };
        if (ct.lado === 'cima' || ct.lado === 'baixo'){
          var yy = ct.lado === 'cima' ? Math.min(y1, y2) - 22 : Math.max(y1, y2) + 24;
          el('line', {x1:x1 + 4, y1:yy, x2:x2 - 4, y2:yy, 'class':'traco-y'}, g);
          el('polygon', {points:seta(x1, yy, -1, 0), style:'fill:var(--yellow)'}, g);
          el('polygon', {points:seta(x2, yy, 1, 0), style:'fill:var(--yellow)'}, g);
          txt(ct.texto, {x:(x1 + x2) / 2, y:ct.lado === 'cima' ? yy - 14 : yy + 40, 'text-anchor':'middle', 'font-size':30, 'class':'c-yellow b'}, g);
        } else {
          var xx = ct.lado === 'esq' ? Math.min(x1, x2) - 24 : Math.max(x1, x2) + 24;
          el('line', {x1:xx, y1:y1 + 4, x2:xx, y2:y2 - 4, 'class':'traco-y'}, g);
          el('polygon', {points:seta(xx, y1, 0, -1), style:'fill:var(--yellow)'}, g);
          el('polygon', {points:seta(xx, y2, 0, 1), style:'fill:var(--yellow)'}, g);
          var tx = ct.lado === 'esq' ? xx - 14 : xx + 40, ty = (y1 + y2) / 2;
          txt(ct.texto, {x:tx, y:ty, 'text-anchor':'middle', 'font-size':30, 'class':'c-yellow b', transform:'rotate(-90 ' + tx + ' ' + ty + ')'}, g);
        }
      });
      oculto(g);
      tl.fromTo(g, {opacity:0, scale:.94, transformOrigin:'50% 50%'}, {opacity:1, scale:1, duration:.6, ease:'power2.out'}, P_(a));
    };

    // Reta numérica com faixas de alternativas e um ponto
    // {tipo:'reta', id, x0, x1, y, min, max, faixas:[['A',18,20],...], destaque:[25,27], ponto:{v:25.25, texto:'25,25'}}
    PECAS.reta = function(a){
      var g = el('g', {}, L.painel), X0 = a.x0 != null ? a.x0 : 660, X1 = a.x1 != null ? a.x1 : 1520, Y = a.y || 380, V0 = a.min, V1 = a.max;
      function rx(v){ return X0 + (v - V0) * (X1 - X0) / (V1 - V0); }
      O[a.id || 'reta'] = {g:g};
      var eixo = el('line', {x1:X0 - 14, y1:Y, x2:X1 + 14, y2:Y, 'class':'traco'}, g);
      for (var v = V0; v <= V1; v++){
        el('line', {x1:rx(v), y1:Y - 10, x2:rx(v), y2:Y + 10, 'class':'traco'}, g);
        txt(String(v), {x:rx(v), y:Y + 40, 'text-anchor':'middle', 'font-size':22, 'class':'c-dim b'}, g);
      }
      (a.faixas || []).forEach(function(f){
        var gf = el('g', {}, g);
        el('rect', {x:rx(f[1]) + 3, y:Y - 58, width:rx(f[2]) - rx(f[1]) - 6, height:16, rx:8, 'class':'sombra'}, gf);
        txt(f[0], {x:(rx(f[1]) + rx(f[2])) / 2, y:Y - 72, 'text-anchor':'middle', 'font-size':28, 'class':'c-chalk b'}, gf);
      });
      var barra = a.destaque ? oculto(el('rect', {x:rx(a.destaque[0]) + 3, y:Y - 58, width:rx(a.destaque[1]) - rx(a.destaque[0]) - 6, height:16, rx:8, style:'fill:var(--ok)'}, g)) : null;
      var ponto = null, pt = null;
      if (a.ponto){
        ponto = oculto(el('circle', {cx:rx(a.ponto.v), cy:Y, r:11, style:'fill:var(--yellow)'}, g));
        pt = oculto(txt(a.ponto.texto, {x:rx(a.ponto.v), y:Y + 76, 'text-anchor':'middle', 'font-size':30, 'class':'c-yellow b'}, g));
      }
      oculto(g);
      aparecer(g, P_(a), .4);
      tracar(eixo, '<', .5);
      if (ponto){
        tl.fromTo(ponto, {opacity:0, attr:{cy:Y - 180}}, {opacity:1, attr:{cy:Y}, duration:.7, ease:'bounce.out'}, '>');
        aparecer(pt, '>', .3);
      }
      if (barra) aparecer(barra, '>', .35);
    };

    // Alternativas de uma questão (sem votação): {tipo:'alternativas', id, x, y, w, h, titulo:[..], itens:[['A','texto'],...]}
    PECAS.alternativas = function(a){
      var g = el('g', {}, L.painel), x0 = a.x != null ? a.x : 640, y0 = a.y != null ? a.y : 300, w = a.w || 430, h = a.h || 84;
      O[a.id || 'alternativas'] = {g:g};
      (a.titulo || []).forEach(function(t, i){ txt(t, {x:x0, y:y0 - 85 + i * 47, 'font-size':36, 'class':'c-chalk'}, g); });
      (a.itens || []).slice(0, 4).forEach(function(it, i){
        var x = x0 + (i % 2) * (w + 20), y = y0 + Math.floor(i / 2) * (h + 16);
        el('rect', {x:x, y:y, width:w, height:h, rx:16, 'class':'alt-box'}, g);
        el('circle', {cx:x + 44, cy:y + h / 2, r:25, 'class':'alt-circ'}, g);
        txt(it[0], {x:x + 44, y:y + h / 2 + 10, 'text-anchor':'middle', 'font-size':28, 'class':'c-board b'}, g);
        var tt = txt(it[1], {x:x + 88, y:y + h / 2 + 13, 'font-size':34, 'class':'c-chalk'}, g);
        var bw = tt.getBBox().width; if (bw > w - 104) tt.setAttribute('font-size', Math.floor(34 * (w - 104) / bw));
      });
      oculto(g);
      tl.fromTo(g, {opacity:0, x:30}, {opacity:1, x:0, duration:.5}, P_(a));
    };

    // {tipo:'assinatura'}
    PECAS.assinatura = function(a){
      if (!AULA.assinatura) return;
      var t = oculto(txt(AULA.assinatura, {x:800, y:890, 'text-anchor':'middle', 'font-size':19, 'class':'c-dim'}, L.fecho));
      aparecer(t, P_(a), .6);
    };

    /* ==================================================================
       PEÇA: CONTA COM VÍRGULA (× ou ÷ por 10, 100, 1 000...)
       O número de casas que a vírgula anda e o resultado são calculados aqui.
       {tipo:'conta', id, fase:'entrar'|'armar'|'interrogar'|'resolver',
        numero:'468,2', op:'mul'|'div', fator:'100', unidadeDe:'km²', unidadePara:'ha',
        nota:['100 ha em','cada km²'], daFaixa:'idDaFaixa', resultado:'46 820' (opcional, para conferir)}
       ================================================================== */
    var XR = 1000, SLOT = 72;
    function pot10(s){
      var t = normNum(s);
      var m = /^1(0*)$/.exec(t);
      if (!m) throw new Error('O fator precisa ser 10, 100, 1000...: ' + s);
      return m[1].length;
    }
    PECAS.conta = function(a){
      var id = a.id || 'conta', fase = a.fase, C = O[id];
      if (fase === 'entrar'){
        var num = normNum(a.numero), dir = a.op === 'div' ? -1 : 1, n = pot10(a.fator);
        var vp = num.indexOf(',');
        var ds = num.replace(',', ''), D = ds.length, p = vp < 0 ? D : vp;
        var off = dir < 0 ? Math.max(0, n - p + 1) : 0;
        var T = dir > 0 ? Math.max(D, p + n) : off + D;
        var cs = off + p - 1; // a vírgula começa à direita do "slot" cs
        var res = escalar(lerDec(num), dir * n), resTxt = fmtDec(res.n, res.c);
        if (a.resultado != null && normNum(a.resultado) !== resTxt) falha('conta ' + a.numero + (dir > 0 ? ' × ' : ' ÷ ') + a.fator + ': o resultado informado (' + a.resultado + ') não bate com o calculado (' + fmtMilhar(resTxt) + ').');
        var cx = function(i){ return XR - (T - i - .5) * SLOT; };
        var bx = function(i){ return cx(i) + SLOT / 2; };
        var g = el('g', {}, L.conta);
        C = O[id] = {g:g, dir:dir, n:n, D:D, p:p, off:off, T:T, cs:cs, cx:cx, bx:bx, resTxt:resTxt};
        C.linha1 = txt(a.numero, {x:XR, y:320, 'text-anchor':'end', 'font-size':100, 'class':'c-yellow b'}, g);
        if (a.daFaixa) oculto(C.linha1);
        C.un1 = txt(a.unidadeDe || '', {x:XR + 20, y:320, 'font-size':56, 'class':'c-chalk'}, g);
        C.linha2 = txt((dir > 0 ? '× ' : '÷ ') + a.fator, {x:XR, y:440, 'text-anchor':'end', 'font-size':100, 'class':'c-chalk b'}, g);
        C.notas = (a.nota || []).slice(0, 2).map(function(t, i){ return txt(t, {x:XR + 20, y:414 + i * 36, 'font-size':32, 'class':'c-sky'}, g); });
        C.traco = el('line', {x1:Math.min(640, cx(0) - SLOT / 2 - 12), y1:472, x2:XR + 10, y2:472, 'class':'traco'}, g);
        C.dig = ds.split('').map(function(d, i){ return oculto(txt(d, {x:cx(off + i), y:630, 'text-anchor':'middle', 'font-size':100, 'class':'c-chalk b'}, g)); });
        C.zero = {};
        var zs = [];
        if (dir > 0){ for (var s1 = off + D; s1 < T; s1++) zs.push(s1); } else { for (var s2 = 0; s2 < off; s2++) zs.push(s2); }
        zs.forEach(function(s){ C.zero[s] = oculto(txt('0', {x:cx(s), y:630, 'text-anchor':'middle', 'font-size':100, 'class':'c-yellow b'}, g)); });
        C.virg = oculto(txt(',', {x:bx(cs), y:630, 'text-anchor':'middle', 'font-size':100, 'class':'c-yellow b'}, g));
        C.notaZero = oculto(txt(a.notaZero || '← completamos com 0', {x:XR + 24, y:612, 'font-size':30, 'class':'c-sky'}, g));
        // posição final da unidade: à direita do último algarismo que sobra
        var bf = cs + dir * n, decSlots = T - 1 - bf, dm = [];
        for (var s3 = T - 1; s3 > bf; s3--){ var ch = C.zero[s3] ? '0' : (s3 - off >= 0 && s3 - off < D ? ds[s3 - off] : '0'); dm.push(ch); }
        var z = 0; while (z < dm.length && dm[z] === '0') z++;
        var restam = decSlots - z;                       // casas decimais que ficam
        C.bf = bf; C.restam = restam; C.zerosFim = z;
        var ultimo = restam > 0 ? bf + restam : bf;
        C.un3 = txt(a.unidadePara || '', {x:bx(Math.min(T - 1, ultimo)) + 20, y:630, 'font-size':56, 'class':'c-chalk'}, g);
        C.arcos = [];
        for (var m = 0; m < n; m++){
          var b0 = cs + dir * m, b1 = b0 + dir, ga = el('g', {}, g);
          var x0 = bx(b0), x1 = bx(b1), mid = (x0 + x1) / 2;
          var pth = el('path', {d:'M' + x0 + ' 548 Q ' + mid + ' 492 ' + x1 + ' 548', 'class':'traco-y'}, ga);
          var hd = oculto(el('polygon', {points:(x1 - 11) + ',536 ' + (x1 + 9) + ',536 ' + (x1 - 1) + ',556', fill:'var(--yellow)'}, ga));
          C.arcos.push({g:ga, p:pth, h:hd});
        }
        if (a.escala){ // versão reduzida, colocada onde o professor/IA indicar (centro do desenho em "para")
          var bbg = g.getBBox();
          var pc = a.para || [bbg.x + bbg.width / 2, bbg.y + bbg.height / 2];
          gsap.set(g, {scale:a.escala, x:pc[0] - (bbg.x + bbg.width / 2), y:pc[1] - (bbg.y + bbg.height / 2), transformOrigin:'50% 50%'});
        }
        if (a.daFaixa){
          var fx = obj(a.daFaixa);
          C.voador = oculto(txt(a.numero, {x:fx.numX, y:122, 'font-size':32, 'class':'c-yellow b'}, g));
          C.alvoX = C.linha1.getBBox().x;
          tl.set(C.voador, {opacity:1}, P_(a));
          tl.to(C.voador, {attr:{x:C.alvoX, y:320, 'font-size':100}, duration:1, ease:'power2.inOut'}, '>');
          tl.set(C.linha1, {opacity:1}, '>');
          tl.set(C.voador, {opacity:0}, '<');
          escrever(C.un1, '>');
        } else {
          escrever(C.linha1, P_(a));
          escrever(C.un1, '>');
        }
      } else if (!C){ throw new Error('conta inexistente: ' + id);
      } else if (fase === 'armar'){
        escrever(C.linha2, P_(a));
        C.notas.forEach(function(t){ escrever(t, '>'); });
        tracar(C.traco, '>', .5);
      } else if (fase === 'interrogar'){
        C.interroga = oculto(txt('?', {x:C.cx(Math.floor(C.T / 2)), y:640, 'text-anchor':'middle', 'font-size':130, 'class':'c-yellow b'}, C.g));
        tl.fromTo(C.interroga, {opacity:0, scale:.4, transformOrigin:'50% 60%'}, {opacity:1, scale:1, duration:.5, ease:'back.out(2.5)'}, P_(a));
      } else if (fase === 'resolver'){
        if (C.interroga) sumir(C.interroga, P_(a), .25);
        gsap.set(C.dig, {y:-30});
        tl.to(C.dig, {opacity:1, y:0, duration:.35, stagger:.12, ease:'back.out(2)'}, C.interroga ? '>' : P_(a));
        tl.to(C.virg, {opacity:1, duration:.3}, '>');
        var primeiro = true;
        for (var mm = 0; mm < C.n; mm++){
          var bb0 = C.cs + C.dir * mm, bb1 = bb0 + C.dir, pulado = C.dir > 0 ? bb0 + 1 : bb0;
          if (C.zero[pulado]){
            tl.fromTo(C.zero[pulado], {opacity:0, scale:.3, transformOrigin:'50% 70%'}, {opacity:1, scale:1, duration:.4, ease:'back.out(2.2)'}, '>');
            if (primeiro){ aparecer(C.notaZero, '<', .3); primeiro = false; }
          }
          var arco = C.arcos[mm];
          tracar(arco.p, '>.35', .45);
          aparecer(arco.h, '>', .15);
          tl.to(C.virg, {attr:{x:C.bx(bb1)}, duration:.6, ease:'power2.inOut'}, '>');
          sumir(arco.g, '>', .25);
        }
        // zeros que sobram depois da vírgula não mudam o valor: somem
        if (C.zerosFim > 0){
          var sobra = [];
          for (var s4 = C.T - C.zerosFim; s4 < C.T; s4++) sobra.push(C.zero[s4] || C.dig[s4 - C.off]);
          sumir(sobra, '>.25', .35);
        }
        if (C.restam === 0) sumir(C.virg, '>.25', .35);
        if (!primeiro) sumir(C.notaZero, '<', .3);
        // separador de milhar (só quando o resultado é inteiro)
        if (C.restam === 0){
          var porGrupo = {};
          for (var sl = 0; sl <= C.bf; sl++){
            var e = C.zero[sl] || C.dig[sl - C.off];
            if (!e) continue;
            var b = Math.floor((C.bf - sl) / 3);
            if (b > 0) (porGrupo[b] = porGrupo[b] || []).push(e);
          }
          Object.keys(porGrupo).forEach(function(b, i){
            tl.to(porGrupo[b], {attr:{x:'-=' + (26 * Number(b))}, duration:.45, ease:'power2.inOut'}, i === 0 ? '>' : '<');
          });
        }
        escrever(C.un3, '>');
      } else falha('conta: fase desconhecida ' + fase);
    };

    /* ==================================================================
       PEÇA: CONTA EM COLUNA (soma ou subtração de decimais)
       {tipo:'coluna', id, op:'sub'|'add', a:'2,66', b:'2,62', titulo, unidade, x, resultado?}
       Vírgula embaixo de vírgula; a conta é feita aqui, coluna por coluna,
       com "vai um" e "empresta" mostrados.
       ================================================================== */
    PECAS.coluna = function(a){
      var g = el('g', {}, L.painel), id = a.id || 'coluna';
      O[id] = {g:g};
      var A = lerDec(a.a), B = lerDec(a.b), ig = igualaCasas(A, B), c = ig[2], op = a.op === 'add' ? 'add' : 'sub';
      var R = op === 'add' ? ig[0] + ig[1] : ig[0] - ig[1];
      if (R < 0n){ falha('coluna: resultado negativo não é suportado (' + a.a + ' − ' + a.b + ')'); return; }
      var rTxt = fmtDec(R, c);
      if (a.resultado != null && normNum(a.resultado) !== rTxt) falha('coluna ' + a.a + (op === 'add' ? ' + ' : ' − ') + a.b + ': o resultado informado (' + a.resultado + ') não bate com o calculado (' + fmtMilhar(rTxt) + ').');
      // algarismos, alinhados à direita, com as mesmas casas decimais
      function digs(n){ var s = (n < 0n ? -n : n).toString(); while (s.length <= c) s = '0' + s; return s; }
      var sa = digs(ig[0]), sb = digs(ig[1]), sr = digs(R);
      var W = Math.max(sa.length, sb.length, sr.length);
      while (sa.length < W) sa = '0' + sa; while (sb.length < W) sb = '0' + sb; while (sr.length < W) sr = '0' + sr;
      // sem zeros à esquerda "de enfeite" além do necessário
      var I = W - c, mostra = 0;
      while (mostra < I - 1 && sa[mostra] === '0' && sb[mostra] === '0' && sr[mostra] === '0') mostra++;
      var DS = 54, GAP = 26, xr = a.x != null ? a.x : 694;
      var pos = [];
      for (var k = 0; k < W; k++){
        var dist = W - 1 - k; // 0 = última casa
        var extra = (c > 0 && k < W - c) ? GAP : 0; // depois da vírgula, as casas inteiras ficam mais à esquerda
        pos[k] = xr - dist * DS - extra;
      }
      var vx = c > 0 ? (pos[W - c - 1] + pos[W - c]) / 2 : 0;
      var y1 = 300, y2 = 395, y3 = 515, TAM = 84;
      var titulo = a.titulo ? txt(a.titulo, {x:pos[mostra] - 140, y:190, 'font-size':34, 'class':'c-dim b'}, g) : null;
      function linha(s, y, cor){
        var els = [];
        for (var k = mostra; k < W; k++){
          els.push(txt(s[k], {x:pos[k], y:y, 'text-anchor':'middle', 'font-size':TAM, 'class':cor}, g));
        }
        if (c > 0) els.push(txt(',', {x:vx, y:y, 'text-anchor':'middle', 'font-size':TAM, 'class':cor}, g));
        return els;
      }
      var top = linha(sa, y1, 'c-chalk b'), bot = linha(sb, y2, 'c-chalk b');
      var sinal = txt(op === 'add' ? '+' : '−', {x:pos[mostra] - 84, y:y2, 'text-anchor':'middle', 'font-size':TAM, 'class':'c-chalk b'}, g);
      var reg = el('line', {x1:pos[mostra] - 118, y1:426, x2:pos[W - 1] + 40, y2:426, 'class':'traco'}, g);
      var resEls = []; // resultado, criado coluna a coluna
      var unid = a.unidade ? txt(a.unidade, {x:pos[mostra] - 118, y:566, 'font-size':32, 'class':'c-chalk'}, g) : null;
      if (titulo) escrever(titulo, P_(a));
      tl.fromTo(top, {opacity:0}, {opacity:1, duration:.3, stagger:.08}, titulo ? '>' : P_(a));
      tl.fromTo(bot.concat([sinal]), {opacity:0}, {opacity:1, duration:.3, stagger:.08}, '>');
      tracar(reg, '>', .4);
      // contas coluna a coluna, da direita para a esquerda
      var emp = 0, marcas = [];
      for (var col = W - 1; col >= mostra; col--){
        var da = +sa[col], db = +sb[col], r;
        var entrada = emp;
        if (op === 'sub'){
          var ta = da - emp;
          if (ta < db){ ta += 10; emp = 1; } else emp = 0;
          r = ta - db;
          if (entrada || emp){ // mostra o que mudou no de cima
            var t = txt(String(ta), {x:pos[col] + 6, y:y1 - 58, 'text-anchor':'middle', 'font-size':30, 'class':'c-sky b'}, g);
            oculto(t);
            var risco = oculto(el('line', {x1:pos[col] - 20, y1:y1 - 24, x2:pos[col] + 20, y2:y1 - 46, 'class':'traco-y'}, g));
            marcas.push({col:col, els:[t, risco]});
          }
        } else {
          var s = da + db + emp; r = s % 10; emp = s >= 10 ? 1 : 0;
          if (emp && col - 1 >= mostra){
            var tc = oculto(txt('1', {x:pos[col - 1], y:y1 - 58, 'text-anchor':'middle', 'font-size':30, 'class':'c-sky b'}, g));
            marcas.push({col:col, els:[tc]});
          }
        }
        var re = oculto(txt(String(r), {x:pos[col], y:y3, 'text-anchor':'middle', 'font-size':TAM, 'class':'c-yellow b'}, g));
        resEls.push({col:col, el:re});
      }
      if (op === 'add' && emp){ // sobrou "vai um" na última coluna: nasce um algarismo novo à esquerda
        falha('coluna: a soma passou da largura prevista (' + a.a + ' + ' + a.b + '). Use números com o mesmo número de algarismos inteiros.');
      }
      var vr = c > 0 ? oculto(txt(',', {x:vx, y:y3, 'text-anchor':'middle', 'font-size':TAM, 'class':'c-yellow b'}, g)) : null;
      resEls.forEach(function(r, i){
        var m = marcas.filter(function(q){ return q.col === r.col; })[0];
        if (m) tl.to(m.els, {opacity:1, duration:.3}, i === 0 ? '>.2' : '>.15');
        tl.fromTo(r.el, {opacity:0, y:-24}, {opacity:1, y:0, duration:.35, ease:'back.out(2)'}, m ? '>.1' : (i === 0 ? '>.25' : '>.25'));
        if (vr && r.col === W - c) tl.fromTo(vr, {opacity:0}, {opacity:1, duration:.2}, '>');
      });
      if (unid) escrever(unid, '>');
    };

    /* {tipo:'virgula', id, numero:'0,04', op:'mul', casas:6, x:1000, y:340, unidade:'ha',
        nota:'×1 000 000 → a vírgula anda *6* casas', nota2:'Zeros à esquerda não mudam o valor.', resultado:'40000'}
       A vírgula anda para a direita, nascem zeros, os zeros da esquerda somem. */
    PECAS.virgula = function(a){
      var g = el('g', {}, L.painel), id = a.id || 'virgula';
      O[id] = {g:g};
      if (a.op && a.op !== 'mul'){ falha('virgula: por enquanto só a multiplicação (vírgula para a direita) está pronta.'); return; }
      var num = normNum(a.numero), n = Number(a.casas);
      if (!(n >= 1 && n <= 12)){ falha('virgula: "casas" precisa ser de 1 a 12.'); return; }
      var vp = num.indexOf(','), ds = num.replace(',', ''), D = ds.length, p = vp < 0 ? D : vp;
      var esperado = fmtDec(escalar(lerDec(num), n).n, escalar(lerDec(num), n).c);
      if (a.resultado != null && normNum(a.resultado) !== esperado) falha('virgula ' + a.numero + ' × 10^' + n + ': o resultado informado (' + a.resultado + ') não bate com o calculado (' + fmtMilhar(esperado) + ').');
      var total = Math.max(D, p + n), all = ds;
      while (all.length < total) all += '0';
      var NX = a.x != null ? a.x : 1000, NW = 44, Y = a.y != null ? a.y : 340;
      function nx(i){ return NX + i * NW; }
      var ds_els = [];
      for (var i = 0; i < total; i++) ds_els.push(oculto(txt(all[i], {x:nx(i), y:Y, 'text-anchor':'middle', 'font-size':68, 'class':'c-yellow b'}, g)));
      var vg = oculto(txt(',', {x:nx(p - 1) + NW / 2, y:Y, 'text-anchor':'middle', 'font-size':68, 'class':'c-yellow b'}, g));
      var lz = 0; while (lz < p + n - 1 && all[lz] === '0') lz++;
      var decimais = p + n < D;
      var ult = (decimais ? D : p + n) - 1 - lz;
      var un = a.unidade ? txt(a.unidade, {x:nx(ult) + NW / 2 + 14, y:Y, 'font-size':44, 'class':'c-chalk'}, g) : null;
      var nota = a.nota ? txt(a.nota, {x:NX - 20, y:Y + 60, 'font-size':28, 'class':'c-sky'}, g) : null;
      var nota2 = a.nota2 ? txt(a.nota2, {x:NX - 20, y:Y + 98, 'font-size':26, 'class':'c-dim'}, g) : null;
      var iniciais = ds_els.slice(0, D), novos = ds_els.slice(D);
      tl.to(iniciais.concat([vg]), {opacity:1, duration:.3, stagger:.06}, P_(a));
      if (nota) escrever(nota, '>');
      for (var h = 1; h <= n; h++){
        var idx = p - 1 + h; // algarismo que a vírgula acabou de pular
        if (idx >= D && idx < total) tl.fromTo(ds_els[idx], {opacity:0, scale:.3, transformOrigin:'50% 70%'}, {opacity:1, scale:1, duration:.25, ease:'back.out(2)'}, '>');
        tl.to(vg, {attr:{x:nx(p - 1 + h) + NW / 2}, duration:.35, ease:'power2.inOut'}, '>.05');
      }
      if (!decimais) sumir(vg, '>.2', .25);
      if (lz > 0) sumir(ds_els.slice(0, lz), '>', .35);
      if (nota2 && lz > 0) escrever(nota2, '<');
      var resto = ds_els.slice(lz);
      if (lz > 0) tl.to(resto.concat(decimais ? [vg] : []), {attr:{x:'-=' + (lz * NW)}, duration:.45, ease:'power2.inOut'}, '>');
      // espaço de milhar: quem fica à esquerda de cada grupo de 3 anda 14 para trás
      if (!decimais){
        var L2 = resto.length, mov = [];
        resto.forEach(function(e, i){
          var grupos = Math.floor((L2 - 1 - i) / 3);
          if (grupos > 0) mov.push({e:e, d:grupos * 14});
        });
        mov.forEach(function(m, i){ tl.to(m.e, {attr:{x:'-=' + m.d}, duration:.3}, i === 0 ? '>' : '<'); });
      }
      if (un) escrever(un, '>');
    };

    /* ==================================================================
       MONTAGEM: percorre os dados da aula e registra tudo na linha do tempo
       ================================================================== */
    function executar(acoes){
      (acoes || []).forEach(function(a){
        var f = PECAS[a.tipo];
        if (!f){ falha('Peça desconhecida: ' + a.tipo); return; }
        try { f(a); } catch (e){ falha(a.tipo + ': ' + e.message); }
      });
    }
    // estado inicial (passo 0): normalmente a pergunta com votação
    var ini = AULA.inicio || {};
    momentoAtual = 0;
    executar(ini.acoes);
    if (ini.legenda) legAtual = txt(ini.legenda, {x:800, y:782, 'text-anchor':'middle', 'font-size':40, 'class':'c-chalk'}, L.legenda);

    AULA.passos.forEach(function(p){
      momentoAtual = p.momento || 0;
      executar(p.acoes);
      if (p.legenda) legenda(p.legenda, '<.2');
      fimPasso();
    });

    /* ==================================================================
       NAVEGAÇÃO
       ================================================================== */
    var N = nPasso, tw = null;
    function sync(){
      var m = MOMENTO_DO_PASSO[atual] || 0;
      momEls.forEach(function(e, i){ e.setAttribute('class', i === m ? 'c-yellow b' : 'c-dim'); });
      if (perguntaEst) perguntaEst.altsG.style.pointerEvents = atual === 0 ? 'auto' : 'none';
      contadores.forEach(function(c){ c.el.textContent = 'Contando: ' + (atual >= c.passoFim ? c.total : 1); });
      if (votoEls){
        if (voto === null){ votoEls.l1.textContent = ''; votoEls.l2.textContent = ''; }
        else {
          var ok = perguntaEst && voto === Number(perguntaEst.correta);
          votoEls.l1.textContent = 'A turma votou: ' + (perguntaEst ? perguntaEst.letras[voto] : '');
          votoEls.l2.textContent = ok ? 'Acertou! ✓' : 'Agora sabemos o porquê.';
          votoEls.l2.setAttribute('class', ok ? 'c-ok b' : 'c-yellow b');
        }
      }
      btnVoltar.disabled = atual === 0;
      btnAvancar.textContent = atual === 0 ? 'Começar' : (atual >= N ? 'Recomeçar' : 'Avançar');
    }
    function irPara(k, animar){
      if (tw){ tw.kill(); tw = null; }
      fecharPopup();
      atual = k;
      if (animar && !reduz){ tw = tl.tweenTo('b' + k, {onComplete:function(){ tw = null; }}); }
      else tl.seek('b' + k);
      sync();
    }
    function avancar(){
      if (popupAberto){ fecharPopup(); return; }
      if (tw && tw.isActive()){ tw.kill(); tw = null; tl.seek('b' + atual); return; }
      if (atual >= N){ voto = null; marcarVoto(); irPara(0, false); return; }
      irPara(atual + 1, true);
    }
    function voltar(){
      if (popupAberto){ fecharPopup(); return; }
      if (atual > 0) irPara(atual - 1, false);
    }
    btnAvancar.addEventListener('click', avancar);
    btnVoltar.addEventListener('click', voltar);
    svg.addEventListener('click', avancar);
    document.addEventListener('keydown', function(e){
      if (['ArrowRight','PageDown',' ','Enter'].indexOf(e.key) !== -1){ e.preventDefault(); avancar(); }
      else if (['ArrowLeft','PageUp'].indexOf(e.key) !== -1){ e.preventDefault(); voltar(); }
      else if (e.key === 'Escape') fecharPopup();
    });
    window.__aula = {irPara:irPara, total:N, erros:ERROS};
    tl.seek('b0');
    sync();
  }
}

window.ChronosMotor = {iniciar:iniciar, erro:erro, util:{lerDec:lerDec, fmtDec:fmtDec, escalar:escalar, igualaCasas:igualaCasas}};
})();
