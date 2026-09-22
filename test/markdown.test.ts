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

test('a bare fence emits the diagram with no wrapper', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ svg: '<svg class="pikchr"></svg>' }));
  assert.equal(md.render('```pikchr\nbox\n```'), '<svg class="pikchr"></svg>');
});

test('alt becomes an accessible name, caption a figure, align a class', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ svg: '<svg></svg>' }));
  const html = md.render('```pikchr {alt="A box" caption="Figure 1" align="center"}\nbox\n```');
  assert.match(html, /<figure class="pikchr-figure pikchr-align-center">/);
  assert.match(html, /<div role="img" aria-label="A box"><svg><\/svg><\/div>/);
  assert.match(html, /<figcaption>Figure 1<\/figcaption>/);
  // The caption must sit outside the image role to stay readable by assistive technology.
  assert.ok(html.indexOf('</div>') < html.indexOf('<figcaption>'));
});

test('align alone still produces a figure to carry the class', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ svg: '<svg></svg>' }));
  const html = md.render('```pikchr {align="right"}\nbox\n```');
  assert.match(html, /<figure class="pikchr-figure pikchr-align-right"><svg><\/svg><\/figure>/);
});

test('class is passed to the renderer, not written onto a wrapper', () => {
  let seen: string | undefined = 'unset';
  const md = markdownPlugin(new MarkdownIt(), (_source, extraClass) => {
    seen = extraClass;
    return { svg: '<svg></svg>' };
  });
  md.render('```pikchr {class="wide"}\nbox\n```');
  assert.equal(seen, 'wide');
  md.render('```pikchr\nbox\n```');
  assert.equal(seen, undefined);
});

test('attribute text is escaped, including quotes, markup and Markdown', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ svg: '<svg></svg>' }));
  const html = md.render(
    '```pikchr {alt="<img src=x onerror=alert(1)>" caption="**bold** & \\"quoted\\""}\nbox\n```'
  );
  // The payload survives as text, which is the point: escaped, it creates no element and fires
  // nothing. The preview does not sanitize, so this escaping is the only thing standing here.
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /aria-label="&lt;img src=x onerror=alert\(1\)&gt;"/);
  assert.match(html, /<figcaption>\*\*bold\*\* &amp; &quot;quoted&quot;<\/figcaption>/);
});

test('malformed attributes are ignored silently and the diagram still renders', () => {
  const reported: string[] = [];
  const md = markdownPlugin(new MarkdownIt(), () => ({ svg: '<svg></svg>' }), m => reported.push(m));
  const html = md.render('```pikchr {alt="unterminated}\nbox\n```');
  assert.equal(html, '<svg></svg>');
  assert.doesNotMatch(html, /error/i);
  assert.equal(reported.length, 1);
});

test("pikchr's own error report is emitted in place of a diagram", () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ errorAsHtml: '<pre class="pikchr-error">syntax error</pre>' }));
  const html = md.render('# Before\n```pikchr\nnonsense\n```\nAfter');
  assert.match(html, /pikchr-error/);
  assert.match(html, /<p>After<\/p>/);
});
