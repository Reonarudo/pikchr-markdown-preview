import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import { markdownPlugin } from '../src/markdown';

test('claims exactly pikchr fences and passes the source through', () => {
  let seen = '';
  const md = markdownPlugin(new MarkdownIt(), source => { seen = source; return { svg: '<svg></svg>' }; });
  assert.match(md.render('```pikchr\nbox "hi"\n```'), /<svg>/);
  assert.equal(seen, 'box "hi"\n');
});

test('preserves unrelated fences byte for byte including highlighting and metadata', () => {
  for (const language of ['swift', 'javascript', 'gnuplot', '', 'Pikchr', 'pikchr extra']) {
    const input = '```' + language + '\nlet x = "<hello>";\n```';
    const options = { highlight: () => '<b>highlight</b>' };
    const delegated = markdownPlugin(new MarkdownIt(options), () => { throw new Error('wrong fence'); });
    assert.equal(delegated.render(input), new MarkdownIt(options).render(input));
  }
});

test('a previously registered fence renderer still receives its fences', () => {
  const md = new MarkdownIt();
  md.renderer.rules.fence = () => '<div class="other-extension"></div>';
  markdownPlugin(md, () => ({ svg: '<svg></svg>' }));
  assert.equal(md.render('```gnuplot\nplot sin(x)\n```'), '<div class="other-extension"></div>');
  assert.match(md.render('```pikchr\nbox\n```'), /<svg>/);
});

test('missing fence renderer falls back without throwing', () => {
  const md = new MarkdownIt();
  delete md.renderer.rules.fence;
  const expected = md.render('```swift\n42\n```');
  markdownPlugin(md, () => ({ svg: '<svg></svg>' }));
  assert.equal(md.render('```swift\n42\n```'), expected);
});

test("pikchr's own error report is emitted in place of a diagram", () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ errorAsHtml: '<pre class="pikchr-error">syntax error</pre>' }));
  const html = md.render('# Before\n```pikchr\nnonsense\n```\nAfter');
  assert.match(html, /pikchr-error/);
  assert.match(html, /<p>After<\/p>/);
});
