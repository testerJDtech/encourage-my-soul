/* ==================================================================
   VIEWS — one function per screen, each renders into #view and
   wires up its own handlers.
   ================================================================== */

import { SECTIONS, CONTEXTS, AGES } from "./data.js";
import { state, bro, loadDraft } from "./state.js";
import { view, topbar, esc } from "./dom.js";
import { STEPS, next, back, go, startEdit, isEditing,
         indexOf, indexOfQ, activeQuestions, STEP_ABOUT, STEP_CONTEXT } from "./router.js";
import { answerText, flat, displayAge } from "./answers.js";

/* ---------- shared Previous / Next nav ----------
   Every question screen ends with this, so nothing auto-advances and a
   chosen option stays highlighted until the person moves on themselves. */
function navRow({ nextLabel="Next", nextDisabled=false, gold=false, extra="" } = {}){
  /* editing a single answer from the review list: no Previous to walk
     back through, and the button says where it's taking you */
  const edit = isEditing();
  return `<div class="actions nav">
      ${edit ? "" : `<button class="btn ghost nav-prev" id="prevbtn">&larr; Previous</button>`}
      <button class="btn ${(gold||edit)?"gold ":""}nav-next" id="nextbtn" ${nextDisabled?"disabled":""}>${
        edit ? "Save &amp; go back" : nextLabel}</button>
      ${extra}
    </div>`;
}

function wireNav(){
  const prev = document.getElementById("prevbtn");
  if(prev) prev.onclick = back;
  document.getElementById("nextbtn").onclick = next;
}

/* enable/disable Next as the person answers, without a re-render */
const setNextEnabled = ok => { document.getElementById("nextbtn").disabled = !ok; };

/* has this question got a usable answer yet? */
function isAnswered(q){
  const a = state.answers[q.id];
  if(!a) return false;
  if(q.type==="text") return !!a.text?.trim();
  if(a.other!=null)   return !!a.other.trim();
  return !!a.sel?.length;
}

/* ---------- topbar: back button + progress dots ---------- */
export function renderTopbar(s){
  if(s.k==="home" || s.k==="card" || s.k==="review"){ topbar.innerHTML = ""; return; }

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
      <input type="text" id="agx" class="subfield" inputmode="numeric" pattern="[0-9]*" maxlength="3"
             value="${esc(state.ageExact || "")}" placeholder="Or type your exact age — optional"
             aria-label="Your exact age, optional">
      <p class="hint">If you fill this in, your card shows your age instead of the range.</p>
    </div>
    <div class="field">
      <label class="lbl" for="ct">What church are you from?</label>
      <input type="text" id="ct" value="${esc(state.country)}" placeholder="Optional" maxlength="40">
    </div>
    <div class="actions"><button class="btn wide" id="go" disabled>${isEditing() ? "Save &amp; go back" : "Continue"}</button></div>`;

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

  /* digits only, so the card can't end up with "twenty-ish" as an age */
  document.getElementById("agx").oninput = e => {
    e.target.value = e.target.value.replace(/\D/g,"").slice(0,3);
    state.ageExact = e.target.value;
  };

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
    </div>
    ${navRow({ nextDisabled: state.ctx==null })}`;

  document.getElementById("opts").onclick = e => {
    const b = e.target.closest("[data-i]"); if(!b) return;
    state.ctx = +b.dataset.i;
    [...e.currentTarget.children].forEach(c => c.setAttribute("aria-pressed", c===b));
    setNextEnabled(true);
  };
  wireNav();
}

/* ---------- section divider ---------- */
export function vSection({s}){
  const sec = SECTIONS[s];
  const n = Object.keys(SECTIONS).indexOf(s) + 1;
  view.innerHTML = `
    <div class="sectionnum">${n}</div>
    <h1 class="qtitle" style="margin-top:10px">${sec.name}</h1>
    <p class="lead">${sec.blurb}</p>
    ${navRow({ nextLabel:"Go on then" })}`;
  wireNav();
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
      ${navRow({
        nextDisabled: !q.optional && !isAnswered(q),
        extra: q.optional ? `<button class="linkbtn" id="skip">Skip this one</button>` : ""
      })}`;
    const tx = document.getElementById("tx");
    tx.oninput = () => {
      state.answers[q.id] = { text: tx.value };
      if(!q.optional) setNextEnabled(!!tx.value.trim());
    };
    wireNav();
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
    ${navRow({ nextDisabled: !isAnswered(q) })}
    ${q.section==="love" ? `<p class="tiny">The five love languages are Gary Chapman's framework; the descriptions here are our own.</p>` : ""}`;

  const box = document.getElementById("otherbox");

  const showOther = () => {
    box.innerHTML = `<div class="field">
        <input type="text" id="ot" maxlength="120" placeholder="In your own words…" value="${esc(a.other||"")}">
      </div>`;
    const ot = document.getElementById("ot");
    ot.focus();
    ot.oninput = () => {
      state.answers[q.id] = { other: ot.value };
      setNextEnabled(!!ot.value.trim());
    };
    ot.onkeydown = e => { if(e.key==="Enter" && ot.value.trim()) next(); };
    setNextEnabled(!!ot.value.trim());
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
      setNextEnabled(!!cur.length);
    }else{
      state.answers[q.id] = { sel:[i] };
      kids.forEach(c => c.setAttribute("aria-pressed", c===b));
      setNextEnabled(true);
    }
  };

  wireNav();
}

/* ---------- review: every answer, each one a way back in ----------
   Reached from "Change an answer" on the card. Editing one question
   returns straight here rather than replaying the whole run. */
export function vReview(){
  const row = (stepIdx, label, value, missing) => `
    <button class="reviewrow" data-step="${stepIdx}">
      <span class="rq">${esc(label)}</span>
      <span class="ra ${missing?"none":""}">${missing ? "Not answered yet" : esc(value)}</span>
      <span class="redit">Change</span>
    </button>`;

  const group = name => `<div class="grouphdr"><span>${esc(name)}</span><i></i></div>`;

  let html = group("About you");
  html += row(STEP_ABOUT, "Your details",
    [state.name, state.gender==="s" ? "Female" : state.gender==="b" ? "Male" : "",
     displayAge(state), state.country].filter(Boolean).join(" · "), !state.name);
  html += row(STEP_CONTEXT, "Where you're at right now",
    state.ctx!=null ? CONTEXTS[state.ctx] : "", state.ctx==null);

  let lastSec = null;
  activeQuestions(state).forEach(q => {
    if(q.section!==lastSec){ html += group(SECTIONS[q.section].name); lastSec = q.section; }
    const a = answerText(state, q);
    html += row(indexOfQ(q.id), q.q, a ? flat(a) : "", !a);
  });

  html += group("Anything else");
  html += row(indexOf("extra"), "In your own words", state.extra?.trim() || "", !state.extra?.trim());

  view.innerHTML = `
    <p class="eyebrow">Your answers</p>
    <h1 class="qtitle" style="margin-top:10px">Change anything<br>you like</h1>
    <p class="lead">Tap an answer to edit just that one — you won't have to go through the rest again.</p>
    <div class="reviewlist" id="rows">${html}</div>
    <div class="actions">
      <button class="btn gold wide" id="done">Back to my card</button>
    </div>`;

  document.getElementById("rows").onclick = e => {
    const r = e.target.closest("[data-step]"); if(!r) return;
    startEdit(+r.dataset.step);
  };
  document.getElementById("done").onclick = () => go(indexOf("card"));
}

/* ---------- extras ---------- */
export function vExtra(){
  view.innerHTML = `
    <p class="eyebrow">Last one</p>
    <h1 class="qtitle" style="margin-top:10px">Anything the form<br>missed?</h1>
    <p class="lead">Something someone should know about how to encourage you. Skip it if you're done.</p>
    <div class="field"><textarea id="tx" maxlength="400" placeholder="Optional…">${esc(state.extra)}</textarea></div>
    ${navRow({
      nextLabel:"Make my card", gold:true,
      extra:`<button class="linkbtn" id="skip">Nothing to add</button>`
    })}`;
  document.getElementById("tx").oninput = e => state.extra = e.target.value;
  wireNav();
  document.getElementById("skip").onclick = () => { state.extra = ""; next(); };
}
