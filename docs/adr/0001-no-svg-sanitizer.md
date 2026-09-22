# No SVG sanitizer for Pikchr output

VS Code's Markdown preview does not sanitize plugin output at all — markdown-it runs
with `html: true` and the webview parses and appends the result verbatim — so an
extension that emits untrusted SVG must sanitize it itself. We do not, because Pikchr
is a diagram compiler that emits no scripts, no links and no external references, and
its author states the design goal explicitly: "PIKCHR is designed to safely generate
benign SVG from source text that provided by a hostile agent" (`vendor/pikchr/pikchr.c`).
The only `<script>` and `onclick` in the upstream source sit inside
`#if defined(PIKCHR_SHELL)`, the standalone test harness, which is not part of the
WebAssembly build.

## Considered options

The sibling extension
[gnuplot-markdown-preview](https://github.com/Reonarudo/gnuplot-markdown-preview) ships
an allowlist sanitizer (`src/sanitizer.ts`) and a reader may reasonably ask why this
extension does not. It has to: the gnuplot SVG terminal emits `<script>` for mouse
tracking, so its output genuinely is dangerous. Ours is not, and an allowlist covering
every element Pikchr can emit would be permanent maintenance — re-audited on every
upstream re-sync — against a threat that does not exist here.

## Consequences

Text that reaches the preview from the *document* rather than from Pikchr — the `alt`
and `caption` fence attributes — is not covered by this reasoning and must be
HTML-escaped at the point of use. There is no sanitizer behind that escaping to catch
a mistake.

If a future Pikchr release gains scripting, hyperlinks or external references, this
decision must be revisited before the vendored copy is updated.
