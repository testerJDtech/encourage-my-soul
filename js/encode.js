/* ==================================================================
   ENCODING
   Everything a person answers is packed into the link. Nothing is
   sent anywhere, nothing is stored on a server.

   Format: version, name, gender, age, country, context, then one
   field per question, then the free-text extra — joined with a unit
   separator and base64url'd. Prefixes on a question field:
     ~  free text     *  "something else"     (bare) option indexes
   ================================================================== */

import { QUESTIONS } from "./data.js";

const FS = "\u001f";

const clean = t => (t||"").replace(/[\u001e\u001f]/g,"").slice(0,400);

function b64enc(str){
  const bytes = new TextEncoder().encode(str);
  let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function b64dec(s){
  s = s.replace(/-/g,"+").replace(/_/g,"/");
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

export function encodeState(s){
  const p = ["1", clean(s.name), s.gender, s.age, clean(s.country), s.ctx==null ? "" : String(s.ctx)];
  QUESTIONS.forEach(q => {
    const a = s.answers[q.id];
    if(!a){ p.push(""); return; }
    if(q.type==="text")      p.push(a.text ? "~"+clean(a.text) : "");
    else if(a.other!=null)   p.push("*"+clean(a.other));
    else                     p.push((a.sel||[]).join(","));
  });
  p.push(clean(s.extra));
  return b64enc(p.join(FS));
}

export function decodeState(code){
  try{
    const p = b64dec(code).split(FS);
    if(p[0]!=="1") return null;
    const s = { name:p[1], gender:p[2], age:p[3], country:p[4],
                ctx:p[5]==="" ? null : parseInt(p[5],10), answers:{}, extra:"" };
    QUESTIONS.forEach((q,i) => {
      const raw = p[6+i];
      if(!raw) return;
      if(raw[0]==="~")      s.answers[q.id] = { text:raw.slice(1) };
      else if(raw[0]==="*") s.answers[q.id] = { other:raw.slice(1) };
      else                  s.answers[q.id] = { sel:raw.split(",").map(Number) };
    });
    s.extra = p[6+QUESTIONS.length] || "";
    return s;
  }catch(e){ return null; }
}

export function shareURL(s){
  return location.origin + location.pathname + "#" + encodeState(s);
}
