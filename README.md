# Pikchr Diagram Preview

Adds Pikchr support to VS Code's built-in Markdown preview.

Marketplace ID: `ReoX86.pikchr-diagram-preview`.

![A pikchr diagram in VS Code's built-in markdown preview](example1.png)

![A pikchr diagram in VS Code's built-in markdown preview](example2.png)

## Usage

Create diagrams in markdown using `pikchr` fenced code blocks:

~~~markdown
```pikchr
    color = white
    linerad = 10px
    linewid *= 0.5

    circle radius 10%
    arrow 2*arrowht
    oval "(" bold fit
    arrow 2*arrowht
    arrow
CN: oval "column-name" fit
    arrow 125%
    oval ")" bold fit
    arrow 2*arrowht
    circle same
CM: oval "," bold fit at 1.25*CN.ht below CN
    arrow from CN.e right 2*arrowht then down even with CM then to CM.e
    arrow from CM.w left even with 3*arrowht west of CN.w \
        then up even with CN then to CN.w
```

```pikchr
color = white
arrow right 200% "Markdown" "Source"
box rad 10px "Markdown" "Formatter" "(markdown.c)" fit
arrow right 200% "HTML+SVG" "Output"
arrow <-> down 70% from last box.s
box same "Pikchr" "Formatter" "(pikchr.c)" fit
```
~~~

Fences in any other language are left untouched and handed back to whichever
renderer registered before this extension, so other Markdown preview
extensions keep working in the same document.

## Fence attributes

A `pikchr` fence may carry an attribute block:

~~~markdown
```pikchr {alt="Sine curve" caption="Figure 1: Sine wave" align="center"}
box "hi"
```
~~~

- `alt` — an accessible name, for readers using assistive technology.
- `caption` — plain text shown beneath the diagram.
- `align` — `left`, `center` or `right`.
- `class` — an extra CSS class on the `<svg>`, alongside the built-in
  `pikchr` class.

Values must be quoted, with single or double quotes; a backslash escapes a
matching quote or a backslash. Attributes may appear in any order. Values are
plain text — never Markdown or HTML.

Anything unrecognised is ignored and the diagram still renders: an unknown
attribute, an unknown alignment or a repeated key is dropped, and a malformed
block is dropped whole. Nothing is reported in the preview; details go to the
**Pikchr Markdown Preview** output channel.

Bare `pikchr` fences continue to work unchanged.

## Viewing the source

Every diagram carries a small button in its top corner that flips the fence
between the diagram and the fence's text, highlighted the way the preview shows
any other code block. A flipped fence stays flipped while you edit the
document, after *Markdown: Refresh Preview*, and when the preview is reopened;
flip it back to see the diagram again. The button is a reader's control: a fence
cannot be written to open in source view.

## Errors and limits

A fence that pikchr rejects shows the error and its line and column within the
fence in place of the diagram. `print` output appears as text above the
diagram. Each diagram has three seconds to render and a 64 000-character source
limit; a fence that exceeds either shows an error instead, and the rest of the
document still renders.

Requires VS Code 1.101 or newer.

## Development

Requires Node 22 or newer (see `.nvmrc`).

~~~sh
npm ci
npm run lint          # tsc --noEmit
npm test              # node --test
npm run build         # esbuild src -> dist
npm run package       # vsce package, with the renderer library under node_modules
npm run test:package  # render fences in a real VS Code host from the packaged VSIX
npm run test:preview  # the view toggle in a live preview, through Playwright
~~~

Rendering is done by
[pikchr-renderer](https://github.com/Reonarudo/pikchr-renderer), pinned to a
release tarball in `package.json` (`.npmrc` sets `allow-remote=root` for npm 12).
To take a new release, edit the URL (the version appears twice), run
`npm install`, and commit `package.json` and `package-lock.json`.

## Credits

Originally created by [xuzn](https://github.com/xuzn/pikchr-markdown-preview)
and maintained independently since version 0.1.0. Diagram rendering is done by
[Pikchr](https://pikchr.org) by D. Richard Hipp.
