import * as vscode from 'vscode';
const factory = require('./pikchr.js');
import MarkdownIt = require('markdown-it');

let render: any;

export interface PikchrResult {
  svg?: string;
  errorAsHtml?: string;
}

export const pikchr = (source: string): PikchrResult => {
  if (!render) {
    const instance = factory();
    render = instance.cwrap('pikchr', 'string', ['string']);
  }
  const result: string = render(source);
  if (result.startsWith('<svg')) {
    return { svg: result };
  } else {
    return { errorAsHtml: result };
  }
};

function markdownItPikchr(md: MarkdownIt) {
  // Keep whatever fence renderer was registered before us (markdown-it's default, or another
  // extension's, e.g. a gnuplot preview) and hand every fence we do not own back to it.
  // Returning `token.content` here used to replace *all* other fences in the preview with
  // their raw, unescaped text.
  const original = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info.trim() !== "pikchr") {
      return original
        ? original(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    }
    const result = pikchr(token.content);
    // pikchr's own error report is HTML with the source already escaped and the fault marked.
    return result.svg !== undefined ? result.svg : result.errorAsHtml!;
  };
}

export function activate(context: vscode.ExtensionContext) {
  return {
    extendMarkdownIt(md) {
      return md.use(markdownItPikchr);
    }
  }
}
