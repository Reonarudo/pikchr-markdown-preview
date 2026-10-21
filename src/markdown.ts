import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import type { RenderResult } from '@reonarudo/pikchr-renderer';
import { parseAttributes, type FenceAttributes } from './attributes';

/**
 * `pikchr`, alone or followed by an attribute block. First word only, case-sensitive.
 *
 * A fence whose block is malformed is still claimed: the attributes are dropped and the diagram
 * renders bare, rather than falling through to another renderer as raw source.
 */
const CLAIMED = /^pikchr(\s+\{|$)/;

export type Render = (source: string) => RenderResult;
export type Report = (message: string) => void;

type Escape = (text: string) => string;

/** The root of every diagram pikchr-renderer emits carries exactly this class. */
const ROOT_CLASS = /^(<svg\b[^>]*?\sclass=")pikchr(")/;

/**
 * Append the author's class to the root's `pikchr` class rather than replacing it, so the
 * stylesheet's sizing rules still apply. The library never sees it (it has no such input); it is
 * escaped here because the preview does not sanitize.
 */
function addClass(svg: string, extraClass: string | undefined, escape: Escape): string {
  return extraClass ? svg.replace(ROOT_CLASS, (_, open, close) => `${open}pikchr ${escape(extraClass)}${close}`) : svg;
}

function errorBlock(text: string, escape: Escape): string {
  return `<div class="pikchr-error" role="alert"><pre>${escape(text)}</pre></div>\n`;
}

/** The library's plain-text result as the words shown in place of a diagram. */
function describe(result: Exclude<RenderResult, { status: 'success' }>): string {
  switch (result.status) {
    case 'failure': {
      const where = result.line === undefined
        ? ''
        : result.column === undefined ? ` at line ${result.line}` : ` at line ${result.line}, column ${result.column}`;
      return `Pikchr error${where}: ${result.message}`;
    }
    case 'timeout':
      return `Pikchr took longer than ${result.budget} ms; the diagram was not rendered.`;
    case 'unavailable':
      return `Pikchr is unavailable: ${result.reason}`;
  }
}

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
    const escape = md.utils.escapeHtml;
    let result: RenderResult;
    try {
      result = render(token.content);
    } catch (error) {
      // The library throws only for programmer errors, but a throw here would remove the whole
      // extension from the preview (see attributes.ts), so it degrades this fence alone.
      const cause = error instanceof Error ? error.message : String(error);
      report(`Pikchr render failed: ${cause}`);
      return errorBlock(`Pikchr is unavailable: ${cause}`, escape);
    }
    if (result.status !== 'success') {
      return errorBlock(describe(result), escape);
    }
    // `print` output, which pikchr itself wrote above the diagram.
    const notes = result.notes.length
      ? `<div class="pikchr-notes">${result.notes.map(escape).join('<br>')}</div>`
      : '';
    return notes + wrap(md, addClass(result.output, attributes.class, escape), attributes);
  };
  return md;
}
