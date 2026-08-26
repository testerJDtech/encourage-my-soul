/* ==================================================================
   ROUTER
   Builds the list of screens from the questions (skipping any whose
   showIf doesn't apply), and moves between them.

   app.js registers the renderer with setRenderer() so this module
   never has to import the views — keeps the dependency one-way.
   ================================================================== */

import { QUESTIONS } from "./data.js";
import { state, saveDraft } from "./state.js";

export function activeQuestions(s){
  return QUESTIONS.filter(q => !q.showIf || q.showIf(s));
}

export function buildSteps(){
  const steps = [{k:"home"}, {k:"about"}, {k:"welcome"}, {k:"context"}];
  let last = null;
  activeQuestions(state).forEach(q => {
    if(q.section!==last){ steps.push({k:"section", s:q.section}); last = q.section; }
    steps.push({k:"q", q});
  });
  steps.push({k:"extra"}, {k:"card"}, {k:"review"});
  return steps;
}

export let STEPS = buildSteps();
export let step = 0;

export function refreshSteps(){
  STEPS = buildSteps();
  return STEPS;
}

let renderer = () => {};
export const setRenderer = fn => { renderer = fn; };

export function go(n){
  step = Math.max(0, Math.min(STEPS.length-1, n));
  saveDraft();
  renderer();
  window.scrollTo(0,0);
}

/* ---------- editing a single answer ----------
   Jumping in from the review list is a round trip, not a position in
   the run: whichever way they leave the screen, they land back on the
   list rather than being walked through everything that follows. */
let editing = false;
export const isEditing = () => editing;

export function startEdit(n){ editing = true; go(n); }
export function stopEdit(){ editing = false; }

const leaveEdit = () => { editing = false; go(indexOf("review")); };

export const next = () => editing ? leaveEdit() : go(step+1);
export const back = () => editing ? leaveEdit() : go(step-1);

/* find a step by kind, or the step that asks a given question */
export const indexOf   = kind => STEPS.findIndex(x => x.k===kind);
export const indexOfQ  = id   => STEPS.findIndex(x => x.k==="q" && x.q.id===id);

/* step indexes used by name elsewhere, so they only live in one place */
export const STEP_ABOUT   = 1;
export const STEP_CONTEXT = 3;
