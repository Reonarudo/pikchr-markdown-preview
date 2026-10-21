# Third-party notices

## Pikchr renderer

Diagrams are rendered by
[pikchr-renderer](https://github.com/Reonarudo/pikchr-renderer) (MIT), shipped in
this extension under `node_modules/@reonarudo/pikchr-renderer/`. It carries the
Pikchr diagram compiler by D. Richard Hipp, from <https://pikchr.org>, compiled to
WebAssembly with Emscripten. Its own `THIRD_PARTY_NOTICES.md` and `licenses/`
directory give the engine's provenance and licenses:

- Pikchr is distributed under the Zero-Clause BSD license, copyright (C)
  2020-09-01 by D. Richard Hipp <drh@sqlite.org>:

  > Permission to use, copy, modify, and/or distribute this software for
  > any purpose with or without fee is hereby granted.

- The Emscripten runtime is available under the MIT and University of
  Illinois/NCSA licenses.

## xmldom

[`@xmldom/xmldom`](https://github.com/xmldom/xmldom), used by the renderer's
sanitizer, is shipped under `node_modules/@xmldom/xmldom/` with its MIT license.

## Origin of this extension

This extension began as a fork of
[xuzn/pikchr-markdown-preview](https://github.com/xuzn/pikchr-markdown-preview),
MIT licensed, copyright (c) 2021 xuzn. The original notice is retained in
`LICENSE`.
