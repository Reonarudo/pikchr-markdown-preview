# Changelog

## 0.3.0

- Every diagram carries a view toggle in its top corner that flips the fence
  between the diagram and its source text, highlighted as the preview highlights
  any code block. A flipped fence stays flipped while the document is edited,
  after *Markdown: Refresh Preview* and when the preview is reopened. The
  toggle is also present on error cards, and `print` notes hide together with
  the diagram in source view. It is a reader's control; no fence attribute
  presets it.
- A preview script (`media/preview.js`) is contributed for the first time;
  `npm run test:preview` exercises it in a live preview through Playwright.

## 0.2.0

- Diagrams are now rendered by
  [pikchr-renderer](https://github.com/Reonarudo/pikchr-renderer) 1.0.0, the
  library the reonarudo.github.io site also uses, instead of a copy of Pikchr
  inside the extension. Its Pikchr is pikchr.org trunk from 2026-04-03 rather
  than a 2021 build: newer syntax such as `diamond` and `mono` works, and
  coordinates can differ slightly from 0.1.x.
- Each diagram renders in a worker with a three-second budget and a
  64 000-character source limit, and its SVG is sanitized before it reaches the
  preview. A runaway fence shows an error instead of freezing the preview.
- Errors are shown as plain text with the line and column within the fence,
  replacing Pikchr's HTML error report. `print` output appears as text above
  the diagram.
- Requires VS Code 1.101 or newer.
- Includes the 0.1.3 fix below.

## 0.1.3

- Security: a fence's `class` attribute could break out of the `<svg>` class
  attribute and inject markup into the Markdown preview, because it was passed
  to Pikchr, which writes it out unescaped. The class is now HTML-escaped and
  added to the `<svg>` after compilation; Pikchr only ever sees the built-in
  `pikchr` class.

## 0.1.2

- Use the distinct Marketplace display name **Pikchr Diagram Preview**.

## 0.1.1

- Use the distinct Marketplace package name `pikchr-diagram-preview`; the original name was unavailable.

## 0.1.0

- Pikchr fences accept an attribute block: `alt` for an accessible name,
  `caption` for visible text beneath the diagram, `align` for placement, and
  `class` for an extra CSS class on the `<svg>`.
- Diagrams now carry a `pikchr` class and are scaled down to fit the preview
  column instead of overflowing it.
- Unrecognised attributes are ignored rather than reported in the preview.

- Add an original diagram icon matching the Gnuplot extension’s visual family.

First release maintained independently of
[xuzn/pikchr-markdown-preview](https://github.com/xuzn/pikchr-markdown-preview).

- Non-pikchr fences are delegated to the previously registered fence renderer
  instead of being replaced by their raw text, so other Markdown preview
  extensions keep working in the same document.
- Prepared for the `ReoX86` publisher.
- Sources split into `src/`, the Pikchr compiler moved to `vendor/pikchr/`,
  and build output is produced by esbuild into `dist/` instead of being
  committed to the repository.
- Added a test suite (`npm test`) and continuous integration.

## 0.0.5 and earlier

Released as `xuzn.pikchr-markdown-preview`.
