/* ==================================================================
   THE CARD AS A PICTURE
   Draws the card onto a canvas and hands back a PNG, so it can be
   sent as an image to people who won't open a link.

   It's a hand-drawn layout rather than a screenshot of the page:
   nothing external to load, no tainted canvas, and it stays sharp
   because it renders at 2x. Laid out in two passes — once to measure
   the height, once to paint — since the height depends on how much
   text wraps.
   ================================================================== */

import { eachAnswer, metaBits, flat } from "./answers.js";

const W     = 1080;   // image width in layout pixels
const SCALE = 2;      // painted at 2x for sharpness
const M     = 44;     // page margin around the card
const P     = 60;     // padding inside the card
const INNER = W - (M + P) * 2;

const C = {
  dusk:"#D9D8F0", paper:"#FDFCFF", ink:"#241B36", inkSoft:"#5D5180",
  marigold:"#F2A33C", rose:"#C4577C", line:"rgba(36,27,54,.16)"
};

const KARLA    = '"Karla", system-ui, sans-serif';
const FRAUNCES = '"Fraunces", Georgia, serif';
const F = {
  eyebrow:`700 21px ${KARLA}`,
  name:   `600 84px ${FRAUNCES}`,
  tag:    `700 20px ${KARLA}`,
  group:  `700 21px ${KARLA}`,
  qlabel: `700 20px ${KARLA}`,
  answer: `600 38px ${FRAUNCES}`,
  quote:  `italic 600 38px ${FRAUNCES}`,
  love:   `700 27px ${KARLA}`,
  foot:   `400 19px ${KARLA}`
};

/* ---------- small canvas helpers ---------- */

const hasLS = ctx => "letterSpacing" in ctx;
const setLS = (ctx, px) => { if(hasLS(ctx)) ctx.letterSpacing = px+"px"; };

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

/* greedy wrap; falls back to breaking mid-word if a single word is too wide */
function wrap(ctx, text, maxW){
  const out = [];
  String(text).split(/\n/).forEach(para => {
    let line = "";
    para.split(/\s+/).filter(Boolean).forEach(word => {
      const test = line ? line+" "+word : word;
      if(ctx.measureText(test).width <= maxW){ line = test; return; }
      if(line){ out.push(line); line = ""; }
      if(ctx.measureText(word).width <= maxW){ line = word; return; }
      let chunk = "";
      for(const ch of word){
        if(ctx.measureText(chunk+ch).width > maxW){ out.push(chunk); chunk = ch; }
        else chunk += ch;
      }
      line = chunk;
    });
    out.push(line);
  });
  return out.length ? out : [""];
}

function textBlock(ctx, text, font, color, x, y, maxW, lh, paint){
  ctx.font = font;
  wrap(ctx, text, maxW).forEach(l => {
    if(paint){ ctx.fillStyle = color; ctx.fillText(l, x, y); }
    y += lh;
  });
  return y;
}

/* pills: the meta tags under the name, and the love-language chips */
function pillRow(ctx, items, x, y, opts, paint){
  const { font, padX, h, gap, radius, fill, color, alt } = opts;
  ctx.font = font;
  let cx = x, rows = 1;
  items.forEach((t, i) => {
    const w = ctx.measureText(t).width + padX*2;
    if(cx > x && cx + w > x + INNER){ cx = x; y += h + gap; rows++; }
    if(paint){
      ctx.fillStyle = (alt && i===1) ? alt.fill : fill;
      roundRect(ctx, cx, y, w, h, radius);
      ctx.fill();
      ctx.fillStyle = (alt && i===1) ? alt.color : color;
      /* centre against the pill: "middle" does it from the font's own
         metrics, where measuring the font string by hand does not */
      ctx.textBaseline = "middle";
      ctx.fillText(t, cx + padX, y + h/2 + 1);
      ctx.textBaseline = "top";
    }
    cx += w + gap;
  });
  return y + h;
}

/* ---------- the layout, run twice: measure then paint ---------- */

function build(ctx, s, paint){
  const x = M + P;
  let y = M + P;

  setLS(ctx, 3);
  y = textBlock(ctx, "HOW TO ENCOURAGE", F.eyebrow, C.inkSoft, x, y, INNER, 28, paint);
  setLS(ctx, 0);
  y += 8;

  y = textBlock(ctx, s.name || "Someone", F.name, C.ink, x, y, INNER, 88, paint);
  y += 18;

  setLS(ctx, 1);
  y = pillRow(ctx, metaBits(s).map(t => t.toUpperCase()), x, y,
    { font:F.tag, padX:16, h:38, gap:8, radius:19, fill:C.dusk, color:C.inkSoft }, paint);
  setLS(ctx, 0);
  y += 28;

  if(paint){ ctx.fillStyle = C.ink; ctx.fillRect(x, y, INNER, 3); }
  y += 3 + 36;

  const drawGroup = (name, first) => {
    if(!first) y += 20;
    setLS(ctx, 3);
    ctx.font = F.group;
    const label = name.toUpperCase();
    if(paint){
      ctx.fillStyle = C.ink;
      ctx.fillText(label, x, y);
      const lw = ctx.measureText(label).width + 18;
      ctx.fillStyle = C.line;
      ctx.fillRect(x + lw, y + 12, INNER - lw, 1);
    }
    setLS(ctx, 0);
    y += 42;
  };

  const drawEntry = (q, a) => {
    setLS(ctx, 2);
    y = textBlock(ctx, q.short.toUpperCase(), F.qlabel, C.inkSoft, x, y, INNER, 26, paint);
    setLS(ctx, 0);
    y += 8;

    if(a.multi){
      y = pillRow(ctx, a.v, x, y,
        { font:F.love, padX:20, h:52, gap:10, radius:10,
          fill:C.marigold, color:C.ink, alt:{ fill:C.rose, color:C.paper } }, paint);
    }else{
      const v = Array.isArray(a.v) ? a.v[0] : a.v;
      y = textBlock(ctx, a.quote ? `“${v}”` : v,
        a.quote ? F.quote : F.answer, a.quote ? C.rose : C.ink, x, y, INNER, 48, paint);
    }

    y += 22;
    if(paint){
      ctx.strokeStyle = C.line;
      ctx.setLineDash([3,6]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+INNER, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    y += 22;
  };

  eachAnswer(s, drawGroup, drawEntry);

  if(s.extra?.trim()){
    drawGroup("In their own words", false);
    y = textBlock(ctx, `“${s.extra.trim()}”`, F.quote, C.rose, x, y, INNER, 48, paint);
    y += 22;
  }

  y += 12;
  y = textBlock(ctx, "what encourages me · " + location.host, F.foot, C.inkSoft, x, y, INNER, 24, paint);

  return y + P + M;
}

/* ---------- public API ---------- */

async function fontsReady(){
  if(!document.fonts) return;
  try{
    await Promise.all([
      document.fonts.load(F.name),
      document.fonts.load(F.answer),
      document.fonts.load(F.quote),
      document.fonts.load(F.tag)
    ]);
    await document.fonts.ready;
  }catch(e){ /* fall back to system fonts rather than failing the export */ }
}

/* the drawn card, as a canvas — exported so it can be inspected or
   dropped straight into a page; cardImageBlob wraps it into a PNG */
export async function cardCanvas(s){
  await fontsReady();

  const probe = document.createElement("canvas").getContext("2d");
  probe.textBaseline = "top";
  const H = Math.ceil(build(probe, s, false));

  const cv = document.createElement("canvas");
  cv.width  = W * SCALE;
  cv.height = H * SCALE;
  const ctx = cv.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";

  ctx.fillStyle = C.dusk;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.shadowColor = "rgba(36,27,54,.22)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = C.paper;
  roundRect(ctx, M, M, W - M*2, H - M*2, 26);
  ctx.fill();
  ctx.restore();

  build(ctx, s, true);
  return cv;
}

export async function cardImageBlob(s){
  const cv = await cardCanvas(s);
  return new Promise(res => cv.toBlob(res, "image/png"));
}

const slug = n => (n||"card").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "card";

/* Share sheet where the browser has one (phones), a download everywhere
   else. Returns what actually happened so the caller can say so. */
export async function shareCardImage(s, url){
  const blob = await cardImageBlob(s);
  const file = new File([blob], `encourage-${slug(s.name)}.png`, { type:"image/png" });

  if(navigator.canShare?.({ files:[file] })){
    try{
      await navigator.share({ files:[file], title:`How to encourage ${s.name||"me"}`, text:url });
      return "shared";
    }catch(e){
      if(e?.name === "AbortError") return "cancelled";
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
  return "downloaded";
}
