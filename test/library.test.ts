import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import { createRuntime, type Runtime } from '@reonarudo/pikchr-renderer';
import { markdownPlugin } from '../src/markdown';

// These run the real library, to pin the glue's assumptions about its output. Rendering itself
// is pikchr-renderer's to test.

let runtime: Runtime;
before(async () => { runtime = await createRuntime(); });
after(async () => { await runtime.dispose(); });

const plugin = () => markdownPlugin(new MarkdownIt(), source => runtime.render({ source }));

test('the fence class reaches the root of the library output, escaped', () => {
  const html = plugin().render(`\`\`\`pikchr {class='wide"><img src=x>'}\nbox\n\`\`\``);
  assert.match(html, /^<svg [^>]*class="pikchr wide&quot;&gt;&lt;img src=x&gt;"[^>]*>/);
  assert.doesNotMatch(html, /<img/);
});

test('author text in a pikchr error or print output stays text', () => {
  for (const source of [
    'box "<img src=x onerror=alert(1)>" bogus',
    'box\n<script>alert(1)</script>',
    'define m {box "<img src=x>" bogus}\nm',
    'print "<img src=x onerror=alert(1)>"\nbox'
  ]) {
    assert.doesNotMatch(plugin().render('```pikchr\n' + source + '\n```'), /<img|<script/, source);
  }
});

test('a syntax error is reported with its line', () => {
  assert.match(plugin().render('```pikchr\nbox\nnonsense here\n```'), /Pikchr error at line 2, column \d+: syntax error/);
});
