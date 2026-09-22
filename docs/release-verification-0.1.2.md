# Pikchr Diagram Preview 0.1.2

- Merged the independent identity and fence-attribute branches into main, followed by the new icon and Marketplace naming corrections.
- Twenty automated tests pass. Type checking, build, and packaging pass.
- Cross-platform CI passed on Linux, Windows, and macOS: https://github.com/Reonarudo/pikchr-markdown-preview/actions/runs/35746305269
- The packaged runtime passed a real VS Code host test of diagrams, description/caption attributes, HTML escaping, unknown attributes, and unrelated fenced languages. The 0.1.2 runtime, vendored compiler, and icon are byte-identical to that host-tested package.
- Original vector icon source is `media/icon.svg`; the packaged 128px PNG is `media/icon.png`. It matches the navy-and-teal palette of the sibling Gnuplot extension.
- Package identity: `ReoX86.pikchr-diagram-preview`; display name: **Pikchr Diagram Preview**. The original package name and display name were both unavailable on Marketplace. GitHub-only 0.1.0 and 0.1.1 tags remain intact.
- Release VSIX SHA-256: `2398c09bb8f02021c279d461e19fd48a18a7a27c166ece38fb0529f778fb8dc0`.
- Upstream attribution and license notices are retained. The user's untracked workspace file is not included.
- Marketplace validation completed under the personal ReoX86 publisher. The public listing shows version 0.1.2, and installation by Marketplace ID succeeded in an isolated environment. The installed extension bundle, vendored Pikchr runtime, and icon match the tested release byte for byte.
