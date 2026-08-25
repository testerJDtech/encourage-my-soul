# encourage-my-soul

**What encourages you?** — a small web app that walks you through a dozen questions
about how you like to be encouraged, then turns your answers into a card you can send
to a friend, a partner, whoever wants to know.

Most people have never actually been asked the question. This is a way to answer it
once and hand the answer over.

## How it works

- Answer the questions — a few taps each, plus a couple of optional free-text ones.
- At the end you get a **card**: your answers laid out by section.
- Share it on WhatsApp, by email, as a copied link, or as plain text.
- Whoever opens the link sees your card and a button to make their own.

**There is no server and no database.** Every answer is packed into the link itself
(base64 after the `#`), so the only place your answers exist is in the link you choose
to send. An in-progress draft is kept in `localStorage` on your own device so a refresh
doesn't lose everything.

One consequence worth knowing: a link has no password on it. Anyone who has it can read
the answers.

## Running it locally

The JavaScript uses ES modules, so opening `index.html` straight from the filesystem
(`file://`) won't work — the browser blocks module loading there. Serve the folder over
HTTP instead:

```bash
# from the repo root — any static server will do
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

There is no build step, no bundler, and nothing to install.

## Deploying

It's a static site, so anything that serves files will host it: GitHub Pages, Netlify,
Vercel, Cloudflare Pages. For GitHub Pages, point it at the `main` branch root and it
works as-is.

## Project layout

```
index.html          markup + the two mount points (#topbar, #view)

css/
  tokens.css        colour palette, spacing variables, base type, reset
  layout.css        app shell, topbar, progress dots, the centred stage
  components.css    slips, form fields, pills, buttons, toast
  card.css          the finished shareable card

js/
  data.js           the questions, sections, and dropdown options — the content
  state.js          current answers, viewer mode, localStorage draft
  encode.js         packing/unpacking state into a share link
  dom.js            mount points, HTML escaping, toast, clipboard
  router.js         builds the screen list, moves between screens
  views.js          one function per screen of the form
  card.js           renders the result card and the share actions
  app.js            entry point — wires it together and boots
```

The dependency direction is one-way: `app.js` → `views.js`/`card.js` → `router.js` →
`state.js`/`data.js`. `router.js` never imports the views; `app.js` hands it a renderer
via `setRenderer()`, which keeps the modules free of circular imports.

## Editing the questions

Nearly all the content lives in [`js/data.js`](js/data.js). Each question is an object:

| field | meaning |
| --- | --- |
| `id` | short key — also its slot in the share link |
| `section` | which group it belongs to (see `SECTIONS`) |
| `short` | the label used on the finished card |
| `q` | the question as asked |
| `type` | `single`, `multi` (with `max`), or `text` |
| `options` | the choices, for `single`/`multi` |
| `notes` | optional explainer under each option |
| `other` | adds a "Something else…" box |
| `optional` | shows a "Skip this one" link (`text` questions) |
| `showIf` | function on state — only ask when it returns true |

Add a question and the progress dots, sections, card, and plain-text export all pick it
up on their own.

⚠️ **Careful with existing links.** Answers are stored positionally, so adding a question
at the *end* is safe, but reordering or deleting one will scramble any card links people
have already shared.

## Browser support

Modern evergreen browsers — it uses ES modules, `100dvh`, and the async clipboard API
(with a fallback). No IE, no polyfills.

## Credits

The five love languages are Gary Chapman's framework; the descriptions in the app are
our own wording.
