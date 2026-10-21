import type { ExtensionContext } from 'vscode';
import type MarkdownItConstructor from 'markdown-it';
type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
import { window } from 'vscode';
import type { Runtime } from '@reonarudo/pikchr-renderer';
import { markdownPlugin, type Render } from './markdown';

let runtime: Runtime | undefined;

export async function activate(context: ExtensionContext): Promise<{ extendMarkdownIt(md: MarkdownIt): MarkdownIt }> {
  // Unrecognised fence attributes never surface in the preview (ADR 0002); they are reported here
  // so an author who suspects a typo has somewhere to look.
  const channel = window.createOutputChannel('Pikchr Markdown Preview');
  context.subscriptions.push(channel);
  const report = (message: string) => channel.appendLine(message);

  let render: Render;
  try {
    // Required here, not imported, so that a library that fails to load lands in this `try`
    // instead of failing activation. esbuild leaves it external (ADR 0010).
    const library: typeof import('@reonarudo/pikchr-renderer') = require('@reonarudo/pikchr-renderer');
    const created = await library.createRuntime();
    runtime = created;
    render = (source) => created.render({ source });
  } catch (error) {
    report(`Pikchr renderer failed to load: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    render = () => ({ status: 'unavailable', reason: 'the renderer failed to load; see the "Pikchr Markdown Preview" output.' });
  }
  return { extendMarkdownIt: (md) => markdownPlugin(md, render, report) };
}

export async function deactivate(): Promise<void> {
  await runtime?.dispose();
  runtime = undefined;
}
