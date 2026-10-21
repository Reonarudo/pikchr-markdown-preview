# Pikchr Diagram Preview 0.1.3 and 0.2.0

## 0.1.3

- The security patch (the fence `class` is escaped instead of passed into Pikchr), published first so that users on VS Code older than 1.101 receive it.
- The uploaded VSIX's contents equal a clean rebuild from the 0.1.3 commit (`51c0dc5`). 23 tests, type checking and packaging pass there.
- Release VSIX SHA-256: `e7c066faee5b807755bb0266359bb4c77727f3ee94603827f7002e537ea686de`.
- Marketplace: listed with engine `^1.95.0`. Installed by ID in an isolated environment, its files equal the VSIX. An install by ID with no version from VS Code 1.95.0 resolves to 0.1.3.

## 0.2.0

- Renders through [pikchr-renderer](https://github.com/Reonarudo/pikchr-renderer) 1.0.0, pinned to its release tarball (`integrity` `sha512-CoPTucec9LddcGhGB25LR2aDMCZPCjSYUgf0DPeuX+nIBAwwuyz0bjNFG45EFMfqdtAnRS/OZofYW4MnmC4EXA==`). The library ships unbundled under the VSIX's `node_modules`, together with `@xmldom/xmldom`. `vendor/pikchr/` is gone. Requires VS Code 1.101.
- Commit `c941b03`. 28 tests, type checking, build and packaging pass. The packaged-VSIX host test passes on VS Code 1.143.0 and 1.101.0.
- Cross-platform CI passed on Linux, Windows and macOS, plus the 1.101.0 minimum-version job: https://github.com/Reonarudo/pikchr-markdown-preview/actions/runs/39681815984
- The host test is the guard for `.vscodeignore` trimming: with the library's `vendor/` removed from the unpacked VSIX, it fails.
- VSIX size: **403 625 bytes, 42 files** (0.1.2: 227 732 bytes). `.vscodeignore` trims `*.d.ts` and `*.map` from `node_modules`.
- Release VSIX SHA-256: `c5ef0a0b0cc8d378e51546ae48e8a7027d41aa3c43210300e24c478ad7eb093d`.
- Marketplace: listed with engine `^1.101.0`. Installed by ID in an isolated environment, its files equal the VSIX, except that VS Code adds `__metadata` to `package.json`. The host test run against that **installed** copy passes on VS Code 1.143.0 and 1.101.0: diagrams, attributes, class escaping, a syntax error with its line, `print` notes, a runaway-macro timeout followed by a successful render, and other fences left alone.
