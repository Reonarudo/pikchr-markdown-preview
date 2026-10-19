import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import { pikchr } from '../src/renderer';
import { markdownPlugin } from '../src/markdown';

// These run the real vendored compiler: the escaping under test happens around it.

const rootTag = (svg: string): string => svg.slice(0, svg.indexOf('>') + 1);

test('a fence class is added to the <svg> root alongside the base class', () => {
  assert.equal(
    rootTag(pikchr('box', 'wide').svg!),
    `<svg xmlns='http://www.w3.org/2000/svg' class="pikchr wide" viewBox="0 0 112.32 76.32">`
  );
  assert.match(rootTag(pikchr('box').svg!), / class="pikchr" /);
});

test('a fence class cannot break out of the class attribute', () => {
  const md = markdownPlugin(new MarkdownIt(), pikchr);
  const html = md.render(`\`\`\`pikchr {class='x" onload="alert(1)"><img src=x onerror=alert(1)>'}\nbox\n\`\`\``);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /onload="/);
  assert.equal(
    rootTag(html),
    `<svg xmlns='http://www.w3.org/2000/svg' class="pikchr x&quot; onload=&quot;alert(1)&quot;&gt;` +
    `&lt;img src=x onerror=alert(1)&gt;" viewBox="0 0 112.32 76.32">`
  );
});

test("pikchr's error report carries author text escaped", () => {
  for (const source of [
    'box "<img src=x onerror=alert(1)>" bogus',
    'box\n<script>alert(1)</script>',
    'define m {box "<img src=x>" bogus}\nm',
    'print "<img src=x onerror=alert(1)>"'
  ]) {
    const result = pikchr(source, '"><img src=y>');
    assert.equal(result.svg, undefined, source);
    assert.doesNotMatch(result.errorAsHtml!, /<img|<script/, source);
  }
});
