const factory = require('../vendor/pikchr/pikchr.js');

export interface PikchrResult {
  svg?: string;
  errorAsHtml?: string;
}

/** The class Pikchr writes onto the `<svg>` element, so our preview stylesheet can select it. */
export const BASE_CLASS = 'pikchr';

let render: ((source: string, cssClass: string, flags: number, width: number, height: number) => string) | undefined;

/** The opening of every `<svg>` Pikchr emits for the base class; the fence class is added here. */
const ROOT = `<svg xmlns='http://www.w3.org/2000/svg' class="${BASE_CLASS}"`;

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Compile Pikchr source to SVG, or to Pikchr's own HTML error report.
 *
 * `extraClass` is appended to the base class rather than replacing it, so a fence that names its
 * own class keeps the stylesheet's sizing rules. It is never handed to Pikchr, which copies its
 * class argument into the SVG unescaped: it is escaped and spliced into the root `<svg>` after
 * compilation. The width and height out-parameters are passed as NULL: capturing them would need
 * `_malloc` exported from the WebAssembly build.
 */
export const pikchr = (source: string, extraClass?: string): PikchrResult => {
  if (!render) {
    const instance = factory();
    render = instance.cwrap('pikchr', 'string', ['string', 'string', 'number', 'number', 'number']);
  }
  const compile = render!;
  const result = compile(source, BASE_CLASS, 0, 0, 0);
  if (!result.startsWith('<svg')) {
    return { errorAsHtml: result };
  }
  if (extraClass && result.startsWith(ROOT)) {
    const root = ROOT.slice(0, -1) + ' ' + escapeAttribute(extraClass) + '"';
    return { svg: root + result.slice(ROOT.length) };
  }
  return { svg: result };
};
