const factory = require('../vendor/pikchr/pikchr.js');

export interface PikchrResult {
  svg?: string;
  errorAsHtml?: string;
}

let render: ((source: string) => string) | undefined;

/** Compile Pikchr source to SVG, or to Pikchr's own HTML error report. */
export const pikchr = (source: string): PikchrResult => {
  if (!render) {
    const instance = factory();
    render = instance.cwrap('pikchr', 'string', ['string']) as (source: string) => string;
  }
  const result = render(source);
  if (result.startsWith('<svg')) {
    return { svg: result };
  } else {
    return { errorAsHtml: result };
  }
};
