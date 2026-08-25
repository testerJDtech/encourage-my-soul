/* ==================================================================
   DOM HELPERS
   The two mount points, escaping, the toast, and clipboard copying.
   ================================================================== */

export const view   = document.getElementById("view");
export const topbar = document.getElementById("topbar");

/* every value that came from a person — or from a link — goes through this */
export const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

export function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._x);
  t._x = setTimeout(() => t.classList.remove("show"), 2400);
}

export function copy(text, ok){
  navigator.clipboard?.writeText(text).then(() => toast(ok)).catch(() => {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
    toast(ok);
  });
}
