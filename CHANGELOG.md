# Changelog

## 0.1.0

First release maintained independently of
[xuzn/pikchr-markdown-preview](https://github.com/xuzn/pikchr-markdown-preview).

- Non-pikchr fences are delegated to the previously registered fence renderer
  instead of being replaced by their raw text, so other Markdown preview
  extensions keep working in the same document.
- Published under the `ReoX86` publisher.
- Sources split into `src/`, the Pikchr compiler moved to `vendor/pikchr/`,
  and build output is produced by esbuild into `dist/` instead of being
  committed to the repository.
- Added a test suite (`npm test`) and continuous integration.

## 0.0.5 and earlier

Released as `xuzn.pikchr-markdown-preview`.
