# Pikchr Diagram Preview 0.3.0 verification

Release: the view toggle on every claimed fence (source-toggle spec in `onnx-markdown-preview`). Publisher: ReoX86.
Source tag: `v0.3.0` (`ba092e4e0c38d6e62be6f76fb8f26a16a68601e4`).

- GitHub release: https://github.com/Reonarudo/pikchr-markdown-preview/releases/tag/v0.3.0. This repository has no release workflow: the VSIX was built from the tagged commit on macOS (lint, 41 unit tests, packaging, packaged-VSIX host test on VS Code 1.144.0) and uploaded with `gh release create` together with its `SHA256SUMS`; the uploaded asset was downloaded again and is byte-identical to the tested file.
- VSIX: `pikchr-diagram-preview-0.3.0.vsix`, **408 739 bytes, 43 files** (0.2.0: 403 625 bytes; the growth is `media/preview.js` and the toggle's stylesheet).
- SHA-256: `035eeff6e3b34383d2f8d4141fbd4687a5c62ed57fa3f53c5317678c5abe8198`.
- CI passed on Linux, Windows, macOS and the VS Code 1.101.0 minimum-version job: https://github.com/Reonarudo/pikchr-markdown-preview/actions/runs/40857431564
- The release asset was downloaded, checked against the release's `SHA256SUMS`, and passed `npm run test:package -- <asset>` on VS Code 1.144.0 (2026-10-29).
- `npm run test:preview` on the tagged commit: **8 live checks passed** on VS Code 1.144.0 (2026-10-29), the required line for the first release carrying the toggle (spec 9.7).
- The manual checklist (spec 9.5: three themes, copy-button row, RTL container, focus ring, scroll sync, the extension's quirks) was done on `examples/view-toggle.md` in a development window and accepted by the user on 2026-10-29.

## Marketplace

Published on 2026-10-29 with `npx vsce publish --packagePath <release asset>`, so the Marketplace and GitHub carry the same bytes:
https://marketplace.visualstudio.com/items?itemName=ReoX86.pikchr-diagram-preview

- Listing: 0.3.0 has engine `^1.101.0`; 0.2.0 keeps `^1.101.0` and the older releases `^1.95.0`.
- Installed by ID (`ReoX86.pikchr-diagram-preview@0.3.0`) into an isolated temporary profile with VS Code 1.139.0's CLI. The installed files equal the release asset; `package.json` differs only by the `__metadata` the installer adds.

The normal profile was not modified.
