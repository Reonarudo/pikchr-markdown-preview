# Pikchr Markdown Preview

Adds Pikchr support to VS Code's built-in Markdown preview.

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

## Development

Requires Node 22 or newer (see `.nvmrc`).

~~~sh
npm install
npm run lint     # tsc --noEmit
npm test         # node --test
npm run build    # esbuild src -> dist
npm run package  # vsce package
~~~

`vendor/pikchr/` holds the upstream Pikchr compiler and the WebAssembly build
produced from it by `vendor/pikchr/pikchr.sh`; see `THIRD_PARTY_NOTICES.md`.

## Credits

Originally created by [xuzn](https://github.com/xuzn/pikchr-markdown-preview)
and maintained independently since version 0.1.0. Diagram rendering is done by
[Pikchr](https://pikchr.org) by D. Richard Hipp.
