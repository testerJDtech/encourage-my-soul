# encourage-my-soul

**What encourages you?** — a small web app that walks you through a dozen questions
about how you like to be encouraged, then turns your answers into a card you can send
to a friend, a partner, whoever wants to know.

Most people have never actually been asked the question. This is a way to answer it
once and hand the answer over.

## How it works

- Answer the questions — pick an option, then Previous/Next to move about. Nothing
  jumps ahead on its own, so you can change your mind before moving on.
- At the end you get a **card**: your answers laid out by section.
- Share it on WhatsApp, by email, as a copied link, as plain text, or **as a picture**
  for people who won't open a link.
- **Change an answer** opens a list of everything you said — tap any one to edit just
  that question and come straight back, instead of replaying the whole run.
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
  components.css    slips, form fields, pills, buttons, Previous/Next nav, toast
  card.css          the finished shareable card
  review.css        the "change an answer" list

js/
  data.js           the questions, sections, and dropdown options — the content
  state.js          current answers, viewer mode, localStorage draft
  encode.js         packing/unpacking state into a share link
  dom.js            mount points, HTML escaping, toast, clipboard
  router.js         builds the screen list, moves between screens, edit mode
  views.js          one function per screen of the form, plus the review list
  answers.js        reading answers back: display values and the plain-text card
  image.js          draws the card to a canvas and shares it as a PNG
  card.js           renders the result card and the share actions
  app.js            entry point — wires it together and boots
```

The dependency direction is one-way: `app.js` → `views.js`/`card.js` → `answers.js` →
`router.js` → `state.js`/`data.js`. Two deliberate seams keep it acyclic:

- `router.js` never imports the views. `app.js` hands it a renderer via `setRenderer()`.
- `answers.js` holds everything that reads answers back, so `card.js` and `image.js`
  can share that logic without importing each other.

## Editing one answer

"Change an answer" on the card opens the review list — every question with what you
said, each row a way back into that one question. Picking a row calls `startEdit()`,
which sets a flag in the router; while it's set, both Next and Previous return to the
list rather than stepping through the run. That's why the buttons re-label themselves
to "Save & go back" mid-edit.

Editing your context ("Campus", "Married", …) re-derives which questions apply, so the
list can grow or shrink a row when you come back.

## The picture

`image.js` draws the card onto a `<canvas>` and hands back a PNG — roughly 1080×2400 at
2x, so it stays sharp when it lands in a chat.

It's drawn by hand rather than screenshotted, because a screenshot library would be a
dependency to load and would tangle with the CSP-unfriendly business of inlining fonts.
The layout runs twice: once to measure (the height depends on how much text wraps), then
once to paint. `cardCanvas()` returns the canvas if you want to inspect or embed it;
`cardImageBlob()` wraps it into a PNG.

Sharing prefers the system share sheet (`navigator.share` with a file), which is what
puts it straight into WhatsApp on a phone. Where that isn't available — most desktop
browsers — it falls back to downloading the PNG so it can be attached by hand.

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
have already shared. The same rule applies to the fields either side of the questions in
[`js/encode.js`](js/encode.js): append, and let decoding cope with the field being absent
(that's how `ageExact` was added without breaking older links).

## Age

The age dropdown is a bracket; under it is an optional box for an exact age. If someone
fills that in, the card, the plain text and the picture all show the exact number instead
of the bracket — including over "Rather not say", since typing a number is a deliberate
choice about the same fact. Anything that isn't a believable age (0, 999, letters) falls
back to the bracket, and the input only accepts digits in the first place. The rule lives
in one function, `displayAge()` in [`js/answers.js`](js/answers.js).

## Browser support

Modern evergreen browsers — it uses ES modules, `100dvh`, canvas, and the async
clipboard API (with a fallback). No IE, no polyfills.

Two things degrade rather than break: `navigator.share` with files is phones-mostly, so
desktop downloads the picture instead; and canvas `letterSpacing` is skipped on browsers
that lack it, which only makes the small capitals in the picture slightly tighter.

## Credits

The five love languages are Gary Chapman's framework; the descriptions in the app are
our own wording.
