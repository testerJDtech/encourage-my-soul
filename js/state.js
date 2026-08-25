/* ==================================================================
   STATE
   `state` is the answers being filled in right now. `viewer` is a
   decoded state that arrived in a link — when it's set, the app shows
   that person's card instead of the form.
   Nothing here goes to a server; the draft is this device only.
   ================================================================== */

const BLANK = { name:"", gender:"", age:"", country:"", ctx:null, answers:{}, extra:"" };

export const state = { ...BLANK, answers:{} };

export function resetState(){
  Object.assign(state, BLANK, { answers:{} });
}

/* the "he/she" wording used in the welcome screen */
export const bro = () => state.gender==="s" ? "sis" : "bro";

/* ---------- viewer ---------- */
let viewer = null;
export const getViewer = () => viewer;
export const setViewer = s => { viewer = s; };

/* ---------- draft, so a refresh doesn't lose everything ---------- */
const DRAFT = "wey-draft";

export function saveDraft(){
  try{ localStorage.setItem(DRAFT, JSON.stringify(state)); }catch(e){}
}

export function loadDraft(){
  try{ return JSON.parse(localStorage.getItem(DRAFT) || "null"); }catch(e){ return null; }
}
