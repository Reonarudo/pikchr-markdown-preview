import type { ExtensionContext } from 'vscode';
import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import { window } from 'vscode';
import { markdownPlugin } from './markdown';
import { pikchr } from './renderer';

export function activate(context: ExtensionContext): { extendMarkdownIt(md: MarkdownIt): MarkdownIt } {
  // Unrecognised fence attributes never surface in the preview (ADR 0002); they are reported here
  // so an author who suspects a typo has somewhere to look.
  const channel = window.createOutputChannel('Pikchr Markdown Preview');
  context.subscriptions.push(channel);
  return {
    extendMarkdownIt: (md) => markdownPlugin(md, pikchr, (message) => channel.appendLine(message))
  };
}
