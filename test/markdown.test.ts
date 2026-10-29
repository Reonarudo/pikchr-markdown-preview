import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import { markdownPlugin, type Render } from '../src/markdown';
import { rendering } from './helpers';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" class="pikchr"></svg>';
const success: Render = () => ({ status: 'success', output: SVG, notes: [] });

const ICON_CODE = '<svg class="pikchr-icon-code" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<path d="M5.7 3.3 1 8l4.7 4.7.9-.9L2.8 8l3.8-3.8zM10.3 3.3l-.9.9L13.2 8l-3.8 3.8.9.9L15 8z"/></svg>';
const ICON_GRAPH = '<svg class="pikchr-icon-graph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">' +
  '<rect x="1.5" y="1.5" width="5" height="3.5" rx=".5"/><rect x="9.5" y="1.5" width="5" height="3.5" rx=".5"/><rect x="5.5" y="11" width="5" height="3.5" rx=".5"/>' +
  '<path d="M4 5v3h8V5M8 8v3"/></svg>';
const TOGGLE = `<button type="button" class="pikchr-toggle" aria-pressed="false" aria-label="Source view" title="Source view">${ICON_CODE}${ICON_GRAPH}</button>`;

test('claims exactly pikchr fences and passes the source through', () => {
  let seen = '';
  const md = markdownPlugin(new MarkdownIt(), source => { seen = source; return success(source); });
  assert.match(md.render('```pikchr\nbox "hi"\n```'), /<svg /);
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

test('a previously registered fence renderer still receives its fences, and supplies the source view of ours', () => {
  const md = new MarkdownIt();
  md.renderer.rules.fence = () => '<div class="other-extension"></div>';
  markdownPlugin(md, success);
  assert.equal(md.render('```gnuplot\nplot sin(x)\n```'), '<div class="other-extension"></div>');
  const html = md.render('```pikchr\nbox\n```');
  assert.match(html, /<svg /);
  assert.match(html, /<\/div><div class="other-extension"><\/div><\/div>\n$/);
});

// The DOM contract (docs/source-toggle-spec.md in onnx-markdown-preview, section 2): asserted
// exactly once, here.
test('every claimed fence is wrapped: toggle first, rendering slot, then the delegated source <pre>', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  assert.equal(md.render('```pikchr\nbox\n```'),
    `<div class="pikchr-fence code-line" data-line="0" data-fence-key="c078b228">${TOGGLE}` +
    `<div class="pikchr-rendering">${SVG}</div>` +
    '<pre><code class="language-pikchr">box\n</code></pre>\n</div>\n');
});

test('the wrapper carries code-line and data-line from the token map, and neither without a map', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  const tokens = md.parse('# Title\n\n```pikchr\nbox\n```', {});
  assert.match(md.renderer.render(tokens, md.options, {}), /<div class="pikchr-fence code-line" data-line="2" data-fence-key="c078b228">/);
  for (const token of tokens) token.map = null;
  const bare = md.renderer.render(tokens, md.options, {});
  assert.match(bare, /<div class="pikchr-fence" data-fence-key="c078b228">/);
  assert.doesNotMatch(bare, /data-line/);
});

test('the fence key is FNV-1a of the exact body', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  assert.match(md.render('```pikchr\nbox\n```'), /data-fence-key="c078b228"/);
  assert.match(md.render('```pikchr\n```'), /data-fence-key="811c9dc5"/);
  // The info string and attributes play no part: same body, same key.
  assert.match(md.render('```pikchr {caption="c"}\nbox\n```'), /data-fence-key="c078b228"/);
  assert.match(md.render('```pikchr\nbox \n```'), /data-fence-key="87a252d4"/);
});

test('the source <pre> is the delegated fence rule output, with VS Code-style highlighting kept verbatim', () => {
  const highlighted = markdownPlugin(new MarkdownIt({ highlight: (code, lang) => `<i class="${lang}">${code.trim()}</i>` }), success);
  assert.match(highlighted.render('```pikchr {alt="x"}\nbox\n```'), /<\/div><pre><code class="language-pikchr"><i class="pikchr">box<\/i><\/code><\/pre>\n<\/div>\n$/);
  // VS Code's shell keeps its highlighting and `dir`, but not the scroll-sync class and line,
  // which the wrapper carries for the whole fence.
  const vscode = new MarkdownIt();
  vscode.renderer.rules.fence = (tokens, index) =>
    `<pre><code data-line="${tokens[index]!.map![0]}" class="code-line language-pikchr" dir="auto">${tokens[index]!.content}</code></pre>\n`;
  markdownPlugin(vscode, success);
  assert.match(vscode.render('```pikchr\nbox\n```'), /<\/div><pre><code class="language-pikchr" dir="auto">box\n<\/code><\/pre>\n<\/div>\n$/);
  // Bare markdown-it with no fence rule at all: a hand-built, escaped fallback.
  const md = new MarkdownIt();
  delete md.renderer.rules.fence;
  markdownPlugin(md, success);
  assert.match(md.render('```pikchr\n<box>\n```'), /<\/div><pre><code class="language-pikchr">&lt;box&gt;\n<\/code><\/pre>\n<\/div>\n$/);
});

test('the error block and a renderer that threw sit in the rendering slot, with the source <pre> beside them', () => {
  const failed = markdownPlugin(new MarkdownIt(), () => ({ status: 'failure', message: 'no' }));
  assert.equal(failed.render('```pikchr\nbox\n```'),
    `<div class="pikchr-fence code-line" data-line="0" data-fence-key="c078b228">${TOGGLE}` +
    '<div class="pikchr-rendering"><div class="pikchr-error" role="alert"><pre>Pikchr error: no</pre></div>\n</div>' +
    '<pre><code class="language-pikchr">box\n</code></pre>\n</div>\n');
  const threw = markdownPlugin(new MarkdownIt(), () => { throw new Error('x'); });
  assert.match(threw.render('```pikchr\nbox\n```'), /<div class="pikchr-rendering"><div class="pikchr-error" role="alert"><pre>Pikchr is unavailable: x<\/pre><\/div>\n<\/div><pre><code class="language-pikchr">box\n<\/code><\/pre>\n<\/div>\n$/);
});

test('print notes share the rendering slot with the diagram, so both hide in source view', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ status: 'success', output: SVG, notes: ['n'] }));
  assert.equal(rendering(md.render('```pikchr\nprint "n"\nbox\n```')), `<div class="pikchr-notes">n</div>${SVG}`);
});

test('missing fence renderer falls back without throwing', () => {
  const md = new MarkdownIt();
  delete md.renderer.rules.fence;
  const expected = md.render('```swift\n42\n```');
  markdownPlugin(md, success);
  assert.equal(md.render('```swift\n42\n```'), expected);
});

test('a bare fence emits the diagram with no figure', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  assert.equal(rendering(md.render('```pikchr\nbox\n```')), SVG);
});

test('alt becomes an accessible name, caption a figure, align a class', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  const html = md.render('```pikchr {alt="A box" caption="Figure 1" align="center"}\nbox\n```');
  assert.match(html, /<figure class="pikchr-figure pikchr-align-center">/);
  assert.match(html, /<div role="img" aria-label="A box"><svg [^>]*><\/svg><\/div>/);
  assert.match(html, /<figcaption>Figure 1<\/figcaption>/);
  // The caption must sit outside the image role to stay readable by assistive technology.
  assert.ok(html.indexOf('</div>') < html.indexOf('<figcaption>'));
});

test('align alone still produces a figure to carry the class', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  const html = md.render('```pikchr {align="right"}\nbox\n```');
  assert.match(html, /<figure class="pikchr-figure pikchr-align-right"><svg [^>]*><\/svg><\/figure>/);
});

test('class is added to the <svg> root alongside the base class, not to a wrapper', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  assert.equal(
    rendering(md.render('```pikchr {class="wide"}\nbox\n```')),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" class="pikchr wide"></svg>'
  );
});

test('a fence class cannot break out of the class attribute', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
  const html = md.render(`\`\`\`pikchr {class='x" onload="alert(1)"><img src=x onerror=alert(1)>'}\nbox\n\`\`\``);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /onload="/);
  assert.match(html, /class="pikchr x&quot; onload=&quot;alert\(1\)&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;"/);
});

test('attribute text is escaped, including quotes, markup and Markdown', () => {
  const md = markdownPlugin(new MarkdownIt(), success);
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
  const md = markdownPlugin(new MarkdownIt(), success, m => reported.push(m));
  const html = md.render('```pikchr {alt="unterminated}\nbox\n```');
  assert.equal(rendering(html), SVG);
  assert.doesNotMatch(html, /error/i);
  assert.equal(reported.length, 1);
});

test('print output is shown above the diagram as escaped text', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({
    status: 'success', output: SVG, notes: ['a <b> & c', 'second']
  }));
  const html = md.render('```pikchr {caption="Cap"}\nprint "x"\nbox\n```');
  assert.match(rendering(html), /^<div class="pikchr-notes">a &lt;b&gt; &amp; c<br>second<\/div><figure /);
});

test('a failure renders an escaped error block with its fence-relative position', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({
    status: 'failure', message: 'unknown object "<img src=x>"', line: 2, column: 5
  }));
  const html = md.render('# Before\n```pikchr {caption="Not shown"}\nbox\nnonsense\n```\nAfter');
  assert.match(html, /<div class="pikchr-error" role="alert"><pre>Pikchr error at line 2, column 5: unknown object &quot;&lt;img src=x&gt;&quot;<\/pre><\/div>/);
  assert.doesNotMatch(html, /<img|figcaption/);
  assert.match(html, /<p>After<\/p>/);
});

test('a failure without a position names none', () => {
  const md = markdownPlugin(new MarkdownIt(), () => ({ status: 'failure', message: 'empty pikchr diagram' }));
  assert.match(md.render('```pikchr\n\n```'), /<pre>Pikchr error: empty pikchr diagram<\/pre>/);
});

test('timeout and unavailable render as errors', () => {
  const timedOut = markdownPlugin(new MarkdownIt(), () => ({ status: 'timeout', budget: 3000 }));
  assert.match(timedOut.render('```pikchr\nbox\n```'), /pikchr-error[^]*took longer than 3000 ms/);
  const unavailable = markdownPlugin(new MarkdownIt(), () => ({ status: 'unavailable', reason: 'no <engine>' }));
  assert.match(unavailable.render('```pikchr\nbox\n```'), /pikchr-error[^]*unavailable: no &lt;engine&gt;/);
});

test('a render that throws becomes an error block instead of breaking the preview', () => {
  const md = markdownPlugin(new MarkdownIt(), () => { throw new Error('<boom>'); });
  const html = md.render('```pikchr\nbox\n```\n\nAfter');
  assert.match(html, /pikchr-error[^]*&lt;boom&gt;/);
  assert.match(html, /<p>After<\/p>/);
});
