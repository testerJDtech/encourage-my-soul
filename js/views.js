/* ==================================================================
   VIEWS — one function per screen, each renders into #view and
   wires up its own handlers.
   ================================================================== */

import { SECTIONS, CONTEXTS, AGES } from "./data.js";
import { state, bro, loadDraft } from "./state.js";
import { view, topbar, esc, toast } from "./dom.js";
import { STEPS, next, back } from "./router.js";

/* ---------- topbar: back button + progress dots ---------- */
export function renderTopbar(s){
  if(s.k==="home" || s.k==="card"){ topbar.innerHTML = ""; return; }

  const qSteps = STEPS.filter(x => x.k==="q" || x.k==="context");
  const idx = qSteps.indexOf(s);
  const dots = qSteps.map((x,i) => {
    const cls = i<idx ? "done" : (i===idx ? "now" : "");
    return `<i class="dot ${cls}"></i>`;
  }).join("");

  topbar.innerHTML =
    `<button class="backbtn" id="back">&larr; Back</button>
     <div class="dots">${dots}</div>
     ${idx>=0 ? `<span class="count">${idx+1} / ${qSteps.length}</span>` : ""}`;
  document.getElementById("back").onclick = back;
}

/* ---------- home ---------- */
export function vHome(){
  view.innerHTML = `
    <p class="eyebrow">A question worth answering</p>
    <h1 class="hero" style="margin-top:14px">What<br>encourages<br><span class="mark">you?</span></h1>
    <p class="lead">Most people have never been asked. Take a few minutes, work it out,
    then send it to someone who'd genuinely like to know.</p>
    <div class="actions">
      <button class="btn" id="start">I'm ready</button>
      <button class="linkbtn" id="notnow">Not today</button>
    </div>
    <p class="tiny">Nothing is saved online. Your answers only ever live in a link you choose to share.</p>`;

  document.getElementById("start").onclick = () => {
    const d = loadDraft();
    if(d && d.name && confirm(`Pick up where you left off, ${d.name}?`)) Object.assign(state, d);
    next();
  };
  document.getElementById("notnow").onclick = () => {
    view.innerHTML = `
      <h1 class="qtitle">That's alright.</h1>
      <p class="lead">Some days the answer is just "not today", and that's a fine answer.
      The page will still be here when you want it.</p>
      <div class="actions"><button class="btn ghost" id="goon">Actually, go on then</button></div>`;
    document.getElementById("goon").onclick = () => location.reload();
  };
}

/* ---------- about you ---------- */
export function vAbout(){
  view.innerHTML = `
    <p class="eyebrow">First, the basics</p>
    <h1 class="qtitle" style="margin-top:12px">Who are we<br>encouraging?</h1>
    <div class="field">
      <label class="lbl">Are you male or female?</label>
      <div class="pillrow" id="gender">
        <button class="pill" data-v="b" aria-pressed="${state.gender==='b'}">Male</button>
        <button class="pill" data-v="s" aria-pressed="${state.gender==='s'}">Female</button>
      </div>
    </div>
    <div class="field">
      <label class="lbl" for="nm">Your name</label>
      <input type="text" id="nm" value="${esc(state.name)}" placeholder="What people call you" maxlength="40" autocomplete="given-name">
    </div>
    <div class="field">
      <label class="lbl" for="ag">Age</label>
      <select id="ag">${AGES.map(a => `<option ${state.age===a?"selected":""}>${a}</option>`).join("")}</select>
    </div>
    <div class="field">
      <label class="lbl" for="ct">What church are you from?</label>
      <input type="text" id="ct" value="${esc(state.country)}" placeholder="Optional" maxlength="40">
    </div>
    <div class="actions"><button class="btn wide" id="go" disabled>Continue</button></div>`;

  const nm = document.getElementById("nm");
  const goBtn = document.getElementById("go");
  const check = () => goBtn.disabled = !(state.gender && nm.value.trim());

  document.getElementById("gender").onclick = e => {
    const b = e.target.closest("[data-v]"); if(!b) return;
    state.gender = b.dataset.v;
    [...e.currentTarget.children].forEach(c => c.setAttribute("aria-pressed", c===b));
    check();
  };
  nm.oninput = () => { state.name = nm.value; check(); };
  nm.onkeydown = e => { if(e.key==="Enter" && !goBtn.disabled) next(); };
  document.getElementById("ag").onchange = e => state.age = e.target.value;
  document.getElementById("ct").oninput  = e => state.country = e.target.value;

  state.age = state.age || AGES[0];
  check();
  goBtn.onclick = next;
}

/* ---------- welcome ---------- */
export function vWelcome(){
  view.innerHTML = `
    <p class="eyebrow">${esc(state.name)}</p>
    <h1 class="hero" style="margin-top:14px;font-size:clamp(2.4rem,10vw,4rem)">
      Hey ${bro()},<br>what encourages<br><span class="mark">you?</span>
    </h1>
    <p class="lead">Twelve questions. No wrong answers, no scores. At the end you'll get a
    card you can send to whoever you like.</p>
    <div class="actions">
      <button class="btn gold" id="go">Let's find out</button>
      <button class="btn ghost" id="go2">I don't know, help me</button>
    </div>`;
  document.getElementById("go").onclick  = next;
  document.getElementById("go2").onclick = next;
}

/* ---------- context ---------- */
export function vContext(){
  view.innerHTML = `
    <p class="eyebrow">Question 1</p>
    <h1 class="qtitle" style="margin-top:10px">Where are you at<br>right now?</h1>
    <p class="lead" style="margin-top:8px">This just changes one question later on.</p>
    <div class="slips" id="opts">
      ${CONTEXTS.map((o,i) => `<button class="slip" data-i="${i}" aria-pressed="${state.ctx===i}">${o}</button>`).join("")}
    </div>`;

  document.getElementById("opts").onclick = e => {
    const b = e.target.closest("[data-i]"); if(!b) return;
    state.ctx = +b.dataset.i;
    [...e.currentTarget.children].forEach(c => c.setAttribute("aria-pressed", c===b));
    setTimeout(next, 180);
  };
}

/* ---------- section divider ---------- */
export function vSection({s}){
  const sec = SECTIONS[s];
  const n = Object.keys(SECTIONS).indexOf(s) + 1;
  view.innerHTML = `
    <div class="sectionnum">${n}</div>
    <h1 class="qtitle" style="margin-top:10px">${sec.name}</h1>
    <p class="lead">${sec.blurb}</p>
    <div class="actions"><button class="btn" id="go">Go on then</button></div>`;
  document.getElementById("go").onclick = next;
}

/* ---------- a question ---------- */
export function vQuestion({q}){
  const a = state.answers[q.id] || {};
  const sec = SECTIONS[q.section];

  if(q.type==="text"){
    view.innerHTML = `
      <p class="eyebrow">${sec.name}</p>
      <h1 class="qtitle" style="margin-top:10px">${q.q}</h1>
      ${q.hint ? `<p class="lead" style="margin-top:8px">${q.hint}</p>` : ""}
      <div class="field"><textarea id="tx" maxlength="400" placeholder="Type here…">${esc(a.text||"")}</textarea></div>
      <div class="actions">
        <button class="btn" id="go">Next</button>
        ${q.optional ? `<button class="linkbtn" id="skip">Skip this one</button>` : ""}
      </div>`;
    const tx = document.getElementById("tx");
    tx.oninput = () => state.answers[q.id] = { text: tx.value };
    document.getElementById("go").onclick = next;
    if(q.optional) document.getElementById("skip").onclick = () => { delete state.answers[q.id]; next(); };
    return;
  }

  const multi = q.type==="multi";
  const sel = a.sel || [];
  const opts = q.options.map((o,i) => `
    <button class="slip" data-i="${i}" aria-pressed="${sel.includes(i)}">
      ${o}${q.notes ? `<span class="note">${q.notes[i]}</span>` : ""}
    </button>`).join("");

  view.innerHTML = `
    <p class="eyebrow">${sec.name}${multi ? ` &middot; pick ${q.max}` : ""}</p>
    <h1 class="qtitle" style="margin-top:10px">${q.q}</h1>
    <div class="slips" id="opts">
      ${opts}
      ${q.other ? `<button class="slip" data-other="1" aria-pressed="${a.other!=null}">Something else&hellip;</button>` : ""}
    </div>
    <div id="otherbox"></div>
    ${multi ? `<div class="actions"><button class="btn" id="go" ${sel.length?"":"disabled"}>Next</button></div>` : ""}
    ${q.section==="love" ? `<p class="tiny">The five love languages are Gary Chapman's framework; the descriptions here are our own.</p>` : ""}`;

  const box = document.getElementById("otherbox");

  const showOther = () => {
    box.innerHTML = `<div class="field">
        <input type="text" id="ot" maxlength="120" placeholder="In your own words…" value="${esc(a.other||"")}">
      </div>
      <div class="actions"><button class="btn" id="og">Next</button></div>`;
    const ot = document.getElementById("ot");
    ot.focus();
    ot.oninput = () => state.answers[q.id] = { other: ot.value };
    ot.onkeydown = e => { if(e.key==="Enter" && ot.value.trim()) next(); };
    document.getElementById("og").onclick = () => {
      if(ot.value.trim()) next(); else toast("Add a few words first");
    };
  };
  if(a.other!=null) showOther();

  document.getElementById("opts").onclick = e => {
    const b = e.target.closest("[data-i],[data-other]"); if(!b) return;
    const kids = [...e.currentTarget.children];

    if(b.dataset.other){
      state.answers[q.id] = { other:"" };
      kids.forEach(c => c.setAttribute("aria-pressed", c===b));
      showOther();
      return;
    }

    box.innerHTML = "";
    const i = +b.dataset.i;

    if(multi){
      let cur = (state.answers[q.id]?.sel || []).slice();
      if(cur.includes(i)) cur = cur.filter(x => x!==i);
      else { cur.push(i); if(cur.length>q.max) cur.shift(); }
      state.answers[q.id] = { sel:cur };
      kids.forEach(c => c.dataset.i && c.setAttribute("aria-pressed", cur.includes(+c.dataset.i)));
      document.getElementById("go").disabled = !cur.length;
    }else{
      state.answers[q.id] = { sel:[i] };
      kids.forEach(c => c.setAttribute("aria-pressed", c===b));
      setTimeout(next, 180);
    }
  };

  if(multi) document.getElementById("go").onclick = next;
}

/* ---------- extras ---------- */
export function vExtra(){
  view.innerHTML = `
    <p class="eyebrow">Last one</p>
    <h1 class="qtitle" style="margin-top:10px">Anything the form<br>missed?</h1>
    <p class="lead">Something someone should know about how to encourage you. Skip it if you're done.</p>
    <div class="field"><textarea id="tx" maxlength="400" placeholder="Optional…">${esc(state.extra)}</textarea></div>
    <div class="actions">
      <button class="btn gold" id="go">Make my card</button>
      <button class="linkbtn" id="skip">Nothing to add</button>
    </div>`;
  document.getElementById("tx").oninput = e => state.extra = e.target.value;
  document.getElementById("go").onclick = next;
  document.getElementById("skip").onclick = () => { state.extra = ""; next(); };
}
