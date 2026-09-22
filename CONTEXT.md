# Pikchr Markdown Preview

A VS Code extension that turns Pikchr diagram source, written in fenced code
blocks, into rendered diagrams inside VS Code's built-in Markdown preview.

## Language

**Pikchr fence**:
A fenced code block that this extension claims as its own and renders as a
diagram, identified by the first word of its info string.
_Avoid_: pikchr block, code block, diagram block

**Info string**:
The text following the opening fence delimiter, which names the fence's
language and carries any attributes.
_Avoid_: fence header, language tag, fence info

**Attribute block**:
The brace-delimited portion of a Pikchr fence's info string that adjusts how
that one diagram is rendered.
_Avoid_: options, params, fence args

**Delegation**:
Handing a fence this extension does not claim back to whichever fence renderer
was registered before it, so that other extensions' fences survive in the same
preview.
_Avoid_: fallthrough, passthrough, skipping

**Diagram**:
The rendered SVG produced from a Pikchr fence's source.
_Avoid_: image, picture, figure, chart

**Figure**:
A diagram presented together with its caption, alignment, or both — as opposed
to a bare diagram, which stands alone in the preview.
_Avoid_: block, container, wrapper

**Caption**:
Plain text shown beneath a diagram, describing it for a reader who can see it.
_Avoid_: label, title, legend, description

**Description**:
Plain text conveying a diagram to a reader who cannot see it, spelled `alt` in
the attribute block by analogy with images — though a diagram is inline SVG and
has no HTML `alt` attribute.
_Avoid_: alt text, title, tooltip, a11y label

**Alignment**:
Where a figure sits across the width of the preview.
_Avoid_: float, position, justification

**Error report**:
Pikchr's own HTML rendering of a source error, which marks the faulting token
and is shown in place of a diagram.
_Avoid_: error message, stack trace
