import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import type { RenderResult } from '@reonarudo/pikchr-renderer';
import { parseAttributes, type FenceAttributes } from './attributes';

/** The class on every diagram's root `<svg>`, and the prefix of every class the preview stylesheet selects. */
export const BASE_CLASS = 'pikchr';

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
    // Before rendering, so every return path below, including the catch, has the source view.
    const source = sourceView(md, original, tokens, index, options, env, self);
    let result: RenderResult;
    try {
      result = render(token.content);
    } catch (error) {
      // The library throws only for programmer errors, but a throw here would remove the whole
      // extension from the preview (see attributes.ts), so it degrades this fence alone.
      const cause = error instanceof Error ? error.message : String(error);
      report(`Pikchr render failed: ${cause}`);
      return fence(token, errorBlock(`Pikchr is unavailable: ${cause}`, escape), source);
    }
    if (result.status !== 'success') {
      return fence(token, errorBlock(describe(result), escape), source);
    }
    // `print` output, which pikchr itself wrote above the diagram; it shares the rendering slot.
    const notes = result.notes.length
      ? `<div class="pikchr-notes">${result.notes.map(escape).join('<br>')}</div>`
      : '';
    return fence(token, notes + wrap(md, addClass(result.output, attributes.class, escape), attributes), source);
  };
  return md;
}

// The view toggle (docs/source-toggle-spec.md in onnx-markdown-preview): every claimed fence is
// wrapped with a toggle button, its rendering, and the hidden source view that media/preview.js
// and preview.css swap.

type FenceRule = NonNullable<MarkdownIt['renderer']['rules']['fence']>;

/**
 * The source view: VS Code's highlighted `<pre><code>` for this fence, from the fence rule that
 * was registered before us, called with a shallow-cloned token so neither rule sees the other's
 * changes. Without one (bare markdown-it in a unit test) a plain escaped block stands in.
 */
function sourceView(md: MarkdownIt, original: FenceRule | undefined, ...args: Parameters<FenceRule>): string {
  const [tokens, index, options, env, self] = args;
  const token = tokens[index]!;
  if (!original) {
    const word = md.utils.escapeHtml(token.info.trim().split(/\s+/)[0] ?? '');
    return `<pre><code class="language-${word}">${md.utils.escapeHtml(token.content)}</code></pre>\n`;
  }
  const clone = Object.assign(Object.create(Object.getPrototypeOf(token)), token, {
    attrs: token.attrs ? token.attrs.map((attr) => [...attr]) : null
  });
  const copy = tokens.slice();
  copy[index] = clone;
  return unsynced(original(copy, index, options, env, self));
}

/**
 * Drop VS Code's `code-line` class and `data-line` from the delegated `<code>`, so the wrapper is
 * the one element VS Code's scroll sync sees for this fence. VS Code measures an element's height
 * up to its first nested `.code-line`; a hidden one has a zero rect, which collapsed the wrapper
 * to a pixel in rendering view and sent editor-to-preview sync to the top of the page.
 */
function unsynced(html: string): string {
  return html.replace(/^<pre><code\b[^>]*>/, (tag) =>
    tag.replace(/ data-line="[^"]*"/, '').replace(/ class="([^"]*)"/, (_, names: string) => {
      const kept = names.split(' ').filter((name) => name !== 'code-line').join(' ');
      return kept ? ` class="${kept}"` : '';
    }));
}

/**
 * The wrapper every claimed fence gets: toggle first, the rendering slot, then the source `<pre>`.
 * `code-line` and `data-line` keep VS Code's scroll sync; a token without a map (a bare string
 * through `markdown.api.render`) gets neither.
 */
function fence(token: { content: string; map: [number, number] | null }, rendering: string, source: string): string {
  const line = token.map?.[0];
  const classes = line === undefined ? `${BASE_CLASS}-fence` : `${BASE_CLASS}-fence code-line`;
  const lineAttr = line === undefined ? '' : ` data-line="${line}"`;
  return `<div class="${classes}"${lineAttr} data-fence-key="${fenceKey(token.content)}">${TOGGLE}` +
    `<div class="${BASE_CLASS}-rendering">${rendering}</div>${source}</div>\n`;
}

/** The fence key: FNV-1a, 32-bit, of the exact body, as eight hex digits. The script never hashes. */
function fenceKey(body: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < body.length; i++) {
    hash ^= body.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// Both glyphs ship; the stylesheet shows the one naming the view a click leads to.
const ICON_CODE = `<svg class="${BASE_CLASS}-icon-code" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">` +
  '<path d="M5.7 3.3 1 8l4.7 4.7.9-.9L2.8 8l3.8-3.8zM10.3 3.3l-.9.9L13.2 8l-3.8 3.8.9.9L15 8z"/></svg>';
const ICON_GRAPH = `<svg class="${BASE_CLASS}-icon-graph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">` +
  '<rect x="1.5" y="1.5" width="5" height="3.5" rx=".5"/><rect x="9.5" y="1.5" width="5" height="3.5" rx=".5"/><rect x="5.5" y="11" width="5" height="3.5" rx=".5"/>' +
  '<path d="M4 5v3h8V5M8 8v3"/></svg>';
const TOGGLE = `<button type="button" class="${BASE_CLASS}-toggle" aria-pressed="false" aria-label="Source view" title="Source view">${ICON_CODE}${ICON_GRAPH}</button>`;
