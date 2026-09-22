const factory = require('../vendor/pikchr/pikchr.js');

export interface PikchrResult {
  svg?: string;
  errorAsHtml?: string;
}

/** The class Pikchr writes onto the `<svg>` element, so our preview stylesheet can select it. */
export const BASE_CLASS = 'pikchr';

let render: ((source: string, cssClass: string, flags: number, width: number, height: number) => string) | undefined;

/**
 * Compile Pikchr source to SVG, or to Pikchr's own HTML error report.
 *
 * `extraClass` is appended to the base class rather than replacing it, so a fence that names its
 * own class keeps the stylesheet's sizing rules. The width and height out-parameters are passed
 * as NULL: capturing them would need `_malloc` exported from the WebAssembly build.
 */
export const pikchr = (source: string, extraClass?: string): PikchrResult => {
  if (!render) {
    const instance = factory();
    render = instance.cwrap('pikchr', 'string', ['string', 'string', 'number', 'number', 'number']);
  }
  const compile = render!;
  const cssClass = extraClass ? `${BASE_CLASS} ${extraClass}` : BASE_CLASS;
  const result = compile(source, cssClass, 0, 0, 0);
  if (result.startsWith('<svg')) {
    return { svg: result };
  } else {
    return { errorAsHtml: result };
  }
};
