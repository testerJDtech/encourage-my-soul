/* ==================================================================
   READING ANSWERS BACK
   Turning stored answers into something displayable, in the three
   places a card gets rendered: the page, the plain-text copy, and the
   picture. Lives on its own so card.js and image.js can both use it
   without importing each other.
   ================================================================== */

import { SECTIONS, CONTEXTS } from "./data.js";
import { activeQuestions } from "./router.js";
import { shareURL } from "./encode.js";

/* one answer, normalised: a text quote, an "other", or option labels */
export function answerText(s, q){
  const a = s.answers[q.id]; if(!a) return null;
  if(q.type==="text") return a.text?.trim() ? { v:a.text.trim(), quote:true } : null;
  if(a.other!=null)   return a.other.trim() ? { v:a.other.trim() } : null;
  if(!a.sel?.length)  return null;
  return { v:a.sel.map(i => q.options[i]).filter(Boolean), multi:q.type==="multi" };
}

/* An exact age wins over the bracket when there is one, since typing it
   is a deliberate choice — even over "Rather not say", which is about
   the bracket. Anything that isn't a believable age falls back. */
export function displayAge(s){
  const n = parseInt(String(s.ageExact ?? "").trim(), 10);
  if(n >= 1 && n <= 120) return String(n);
  return s.age && s.age!=="Rather not say" ? s.age : "";
}

/* the little descriptors under the name — brother/sister, age, church, context */
export function metaBits(s){
  return [ s.gender==="s" ? "sister" : "brother",
           displayAge(s),
           s.country || "",
           s.ctx!=null ? CONTEXTS[s.ctx] : "" ].filter(Boolean);
}

/* one answer flattened to a single string */
export const flat = a => Array.isArray(a.v) ? a.v.join(" + ") : a.v;

/* walk the answered questions, calling back at each section change.
   Shared by the text and picture renderers so they never drift apart. */
export function eachAnswer(s, onSection, onEntry){
  let lastSec = null;
  activeQuestions(s).forEach(q => {
    const a = answerText(s, q); if(!a) return;
    if(q.section!==lastSec){ onSection(SECTIONS[q.section].name, lastSec===null); lastSec = q.section; }
    onEntry(q, a);
  });
  return lastSec;
}

/* ------------------------------------------------------------------
   PLAIN TEXT
   Written for a chat window: no markdown (WhatsApp and email would
   render it differently), just capitals, rules and indentation, with
   a blank line between every section so it doesn't read as a wall.
   ------------------------------------------------------------------ */
export function plainText(s){
  const name = (s.name || "Someone").toUpperCase();
  const out = [];
  const rule = n => "─".repeat(n);

  out.push(`HOW TO ENCOURAGE ${name}`);
  const meta = metaBits(s);
  if(meta.length) out.push(meta.join(" · "));

  eachAnswer(s,
    heading => {
      const h = heading.toUpperCase();
      out.push("", "", h, rule(h.length));
    },
    (q, a) => {
      const v = flat(a);
      out.push("", q.short, a.quote ? `   “${v}”` : `   ${v}`);
    }
  );

  if(s.extra?.trim()){
    const h = "IN THEIR OWN WORDS";
    out.push("", "", h, rule(h.length), "", `   “${s.extra.trim()}”`);
  }

  out.push("", "", rule(24), `See the full card:`, shareURL(s));
  return out.join("\n");
}
