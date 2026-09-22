import type { ExtensionContext } from 'vscode';
import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import { markdownPlugin } from './markdown';
import { pikchr } from './renderer';

export function activate(_context: ExtensionContext): { extendMarkdownIt(md: MarkdownIt): MarkdownIt } {
  return {
    extendMarkdownIt: (md) => markdownPlugin(md, pikchr)
  };
}
