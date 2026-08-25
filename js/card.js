/* ==================================================================
   THE CARD — the finished result, and the ways to send it.
   Rendered in two modes: your own card (share buttons) and someone
   else's, arrived at through a link (a "make your own" button).
   ================================================================== */

import { SECTIONS, CONTEXTS } from "./data.js";
import { resetState, setViewer } from "./state.js";
import { view, topbar, esc, copy } from "./dom.js";
import { activeQuestions, go, STEP_ABOUT, STEP_CONTEXT } from "./router.js";
import { shareURL } from "./encode.js";

/* one answer, normalised for display: text quote, "other", or option labels */
export function answerText(s, q){
  const a = s.answers[q.id]; if(!a) return null;
  if(q.type==="text") return a.text?.trim() ? { v:a.text.trim(), quote:true } : null;
  if(a.other!=null)   return a.other.trim() ? { v:a.other.trim() } : null;
  if(!a.sel?.length)  return null;
  return { v:a.sel.map(i => q.options[i]).filter(Boolean), multi:q.type==="multi" };
}

export function plainText(s){
  const lines = [`How to encourage ${s.name}`, ""];
  activeQuestions(s).forEach(q => {
    const a = answerText(s,q); if(!a) return;
    const v = Array.isArray(a.v) ? a.v.join(" + ") : a.v;
    lines.push(`${q.short}: ${v}`);
  });
  if(s.extra?.trim()) lines.push("", s.extra.trim());
  return lines.join("\n");
}

export function renderCard(s, isViewer){
  topbar.innerHTML = "";
  const name = s.name || "Someone";
  const heIs = s.gender==="s" ? "sister" : "brother";

  let body = "", lastSec = null, delay = 0;
  activeQuestions(s).forEach(q => {
    const a = answerText(s, q); if(!a) return;
    if(q.section!==lastSec){
      body += `<div class="grouphdr"><span>${SECTIONS[q.section].name}</span><i></i></div>`;
      lastSec = q.section;
    }
    delay += 60;
    if(a.multi){
      body += `<div class="entry" style="animation-delay:${delay}ms"><div class="q">${q.short}</div>
        <div class="lovelist">${a.v.map(v => `<span class="love">${esc(v)}</span>`).join("")}</div></div>`;
    }else{
      const v = Array.isArray(a.v) ? a.v[0] : a.v;
      body += `<div class="entry" style="animation-delay:${delay}ms"><div class="q">${q.short}</div>
        <div class="a ${a.quote?"quote":""}">${a.quote ? "&ldquo;"+esc(v)+"&rdquo;" : esc(v)}</div></div>`;
    }
  });

  if(s.extra?.trim()){
    body += `<div class="grouphdr"><span>In their own words</span><i></i></div>
      <div class="entry"><div class="a quote">&ldquo;${esc(s.extra.trim())}&rdquo;</div></div>`;
  }

  const tags = [ s.age && s.age!=="Rather not say" ? s.age : "",
                 s.country || "",
                 s.ctx!=null && s.ctx!==3 ? CONTEXTS[s.ctx] : "" ]
               .filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join("");

  const url = shareURL(s);
  const long = url.length > 1800;

  view.innerHTML = `
    ${isViewer ? `<p class="eyebrow" style="margin-bottom:12px">${esc(name)} shared this with you</p>` : ""}
    <div class="card">
      <div class="cardhead">
        <p class="eyebrow">How to encourage</p>
        <h2 style="margin-top:6px">${esc(name)}</h2>
        <div class="meta"><span class="tag">${heIs}</span>${tags}</div>
      </div>
      ${body || `<p class="lead">No answers yet.</p>`}
    </div>
    ${ isViewer ? `
      <div class="actions">
        <button class="btn gold wide" id="mine">Make your own</button>
      </div>`
    : `
      <div class="actions">
        <button class="btn gold" id="wa">Send on WhatsApp</button>
        <button class="btn ghost" id="em">Email it</button>
        <button class="btn ghost" id="cp">Copy link</button>
      </div>
      <div class="actions" style="margin-top:6px">
        <button class="linkbtn" id="edit">Change an answer</button>
        <button class="linkbtn" id="txt">Copy as plain text</button>
      </div>
      ${long ? `<div class="warn">This link is on the long side because of the free-text answers. It'll work on WhatsApp and email, but a few older apps may cut it short — worth testing before you send it far.</div>` : ""}
      <p class="tiny">Anyone with this link can read your answers. There's no password on it, so send it to people you mean to.</p>`}`;

  if(isViewer){
    document.getElementById("mine").onclick = () => {
      setViewer(null);
      history.replaceState(null, "", location.pathname);
      resetState();
      go(STEP_ABOUT);
    };
    return;
  }

  const msg = `Hey — this is what encourages me. ${url}`;
  document.getElementById("wa").onclick = () =>
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  document.getElementById("em").onclick = () =>
    location.href = `mailto:?subject=${encodeURIComponent("What encourages "+name)}&body=${encodeURIComponent(msg)}`;
  document.getElementById("cp").onclick   = () => copy(url, "Link copied");
  document.getElementById("txt").onclick  = () => copy(plainText(s), "Copied as text");
  document.getElementById("edit").onclick = () => go(STEP_CONTEXT);
}
