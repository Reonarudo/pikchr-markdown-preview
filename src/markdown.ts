import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import type { PikchrResult } from './renderer';

/**
 * Claim `pikchr` fences and render them as diagrams.
 *
 * Every fence we do not claim is delegated to whichever fence renderer was registered before us
 * (markdown-it's default, or another extension's, e.g. a gnuplot preview). Returning `token.content`
 * here used to replace *all* other fences in the preview with their raw, unescaped text.
 */
export function markdownPlugin(md: MarkdownIt, render: (source: string) => PikchrResult): MarkdownIt {
  const original = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]!;
    if (token.info.trim() !== 'pikchr') {
      return original
        ? original(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options);
    }
    const result = render(token.content);
    // Pikchr's own error report is HTML with the source already escaped and the fault marked.
    return result.svg !== undefined ? result.svg : result.errorAsHtml!;
  };
  return md;
}
