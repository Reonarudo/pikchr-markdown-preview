# Fence attributes

A captioned, centred diagram with an accessible name:

```pikchr {alt="A box labelled hello, an arrow, and a circle" caption="Figure 1: A box, an arrow and a circle" align="center"}
box "hello" fit
arrow
circle "world" fit
```

A diagram with an extra class, for styling from your own preview stylesheet:

```pikchr {class="narrow"}
box "styled" fit
```

Unrecognised attributes are ignored — this still renders, and the typo is
reported only in the output channel:

```pikchr {algin="center" alt="A single box"}
box "still here" fit
```

A bare fence is unaffected:

```pikchr
box "plain" fit
```
