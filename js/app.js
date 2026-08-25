/* ==================================================================
   APP — wires the modules together and starts the thing.

   Flow: a link with a #hash shows that person's card; anything else
   starts the form at step 0.
   ================================================================== */

import { state, getViewer, setViewer } from "./state.js";
import { decodeState } from "./encode.js";
import { STEPS, step, refreshSteps, setRenderer } from "./router.js";
import { renderTopbar, vHome, vAbout, vWelcome, vContext, vSection, vQuestion, vExtra } from "./views.js";
import { renderCard } from "./card.js";

const SCREENS = {
  home:    vHome,
  about:   vAbout,
  welcome: vWelcome,
  context: vContext,
  section: vSection,
  q:       vQuestion,
  extra:   vExtra,
  card:    () => renderCard(state, false)
};

function render(){
  const viewer = getViewer();
  if(viewer){ renderCard(viewer, true); return; }

  refreshSteps();
  const s = STEPS[step];
  renderTopbar(s);
  SCREENS[s.k](s);
}

function boot(){
  const hash = location.hash.slice(1);
  if(hash){
    const s = decodeState(hash);
    if(s){ setViewer(s); renderCard(s, true); return; }
  }
  setViewer(null);
  render();
}

setRenderer(render);
window.addEventListener("hashchange", boot);
boot();
