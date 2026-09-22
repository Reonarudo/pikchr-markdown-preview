import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import type { PikchrResult } from './renderer';
import { parseAttributes, type FenceAttributes } from './attributes';

/**
 * `pikchr`, alone or followed by an attribute block. First word only, case-sensitive.
 *
 * A fence whose block is malformed is still claimed: the attributes are dropped and the diagram
 * renders bare, rather than falling through to another renderer as raw source.
 */
const CLAIMED = /^pikchr(\s+\{|$)/;

export type Render = (source: string, extraClass?: string) => PikchrResult;
export type Report = (message: string) => void;

function wrap(md: MarkdownIt, diagram: string, attributes: FenceAttributes): string {
  const escape = md.utils.escapeHtml;
  let html = diagram;
  if (attributes.alt !== undefined) {
    // `role="img"` sits inside the figure so that a caption stays outside the image role and
    // remains available to assistive technology.
    html = `<div role="img" aria-label="${escape(attributes.alt)}">${html}</div>`;
  }
  if (attributes.caption === undefined && attributes.align === undefined) {
    return html;
  }
  const classes = attributes.align
    ? `pikchr-figure pikchr-align-${attributes.align}`
    : 'pikchr-figure';
  const caption = attributes.caption === undefined
    ? ''
    : `<figcaption>${escape(attributes.caption)}</figcaption>`;
  return `<figure class="${classes}">${html}${caption}</figure>`;
}

/**
 * Claim `pikchr` fences and render them as diagrams.
 *
 * Every fence we do not claim is delegated to whichever fence renderer was registered before us
 * (markdown-it's default, or another extension's, e.g. a gnuplot preview). Returning
 * `token.content` here used to replace *all* other fences in the preview with their raw,
 * unescaped text.
 */
export function markdownPlugin(md: MarkdownIt, render: Render, report: Report = () => {}): MarkdownIt {
  const original = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]!;
    const info = token.info.trim();
    if (!CLAIMED.test(info)) {
      return original
        ? original(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options);
    }
    const { attributes, diagnostics } = parseAttributes(info);
    for (const diagnostic of diagnostics) {
      report(diagnostic);
    }
    const result = render(token.content, attributes.class);
    // Pikchr's own error report is HTML with the source already escaped and the fault marked.
    if (result.svg === undefined) {
      return result.errorAsHtml!;
    }
    return wrap(md, result.svg, attributes);
  };
  return md;
}
