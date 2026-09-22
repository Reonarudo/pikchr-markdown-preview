# Unrecognised fence attributes are ignored silently

A Pikchr fence whose attribute block contains an unknown key, an unknown alignment, a
duplicate key or malformed syntax still renders its diagram; the offending attributes
are dropped and a line is written to the extension's output channel. Losing a diagram
is a worse outcome for an author than a typo that quietly does nothing, and a preview
that grows warning banners is worse than one that quietly does less.

## Considered options

The sibling extension
[gnuplot-markdown-preview](https://github.com/Reonarudo/gnuplot-markdown-preview) does
the opposite: it throws, and renders a visible fence error in place of the plot. The
two extensions deliberately share an attribute *grammar* — braces, quoted values, the
same `alt` and `caption` spellings — so that an author writing both kinds of fence in
one document need remember only one syntax. They deliberately differ on what happens
once a mistake has been made. That divergence is the decision recorded here.

## Consequences

The parser must be total: it may not throw on any input. VS Code applies markdown-it
plugins inside a `try`/`catch` and silently drops a plugin that throws, so an exception
would not degrade a single fence — it would remove the entire extension from the
preview, taking every diagram in the document with it. `test/attributes.test.ts` pins
this with a fuzz-ish case list.

Because malformed attributes produce no visible feedback, a fence with a broken
attribute block is still *claimed* rather than delegated: it renders as a bare diagram.
Falling through to another renderer would show the author raw Pikchr source, which
looks like the delegation bug this extension exists to avoid.

Reversing this later is a breaking change — documents written against a forgiving
parser begin erroring the day it becomes strict.
