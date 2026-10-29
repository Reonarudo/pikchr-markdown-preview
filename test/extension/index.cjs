const vscode = require('vscode');
const assert = require('node:assert/strict');
const path = require('node:path');

exports.run = async () => {
  const extension = vscode.extensions.getExtension('ReoX86.pikchr-diagram-preview');
  assert(extension, 'extension is installed');
  assert.equal(path.resolve(extension.extensionPath), path.resolve(process.env.PIKCHR_EXTENSION_PATH));
  assert.deepEqual(extension.packageJSON.contributes['markdown.previewStyles'], ['media/preview.css']);
  assert.deepEqual(extension.packageJSON.contributes['markdown.previewScripts'], ['media/preview.js']);
  await extension.activate();
  await vscode.extensions.getExtension('vscode.markdown-language-features').activate();
  const render = (markdown) => vscode.commands.executeCommand('markdown.api.render', markdown);

  const basic = await render(
    '```pikchr\nbox "hello" fit\narrow\ncircle "world" fit\n```\n' +
    '```swift\nlet x = 42\n```\n' +
    '```pikchr\nbox\nnonsense here\n```'
  );
  assert.match(basic, /<svg [^>]*class="pikchr"[^>]*viewBox=|<svg [^>]*viewBox=[^>]*class="pikchr"/, basic);
  assert.match(basic, /<text [^>]*>hello<\/text>/);
  assert.match(basic, /language-swift/);
  assert.match(basic, /<div class="pikchr-error" role="alert"><pre>Pikchr error at line 2, column \d+: syntax error<\/pre><\/div>/);
  assert.doesNotMatch(basic, /unavailable/);

  // The view toggle's wrapper, and its source view delegated to VS Code's own fence rule: the
  // `<pre>` carries VS Code's shell (`dir="auto"`, not the plugin's hand-built fallback) minus
  // the scroll-sync class and line, which only the wrapper carries.
  assert.match(basic, /<div class="pikchr-fence code-line" data-line="0" data-fence-key="[0-9a-f]{8}"><button type="button" class="pikchr-toggle" aria-pressed="false" aria-label="Source view" title="Source view"><svg class="pikchr-icon-code"/);
  assert.match(basic, /<\/button><div class="pikchr-rendering"><svg [^>]*class="pikchr"/);
  assert.match(basic, /<\/div><pre><code class="language-pikchr" dir="auto">box &quot;hello&quot; fit\narrow\ncircle &quot;world&quot; fit\n<\/code><\/pre>\n<\/div>/);
  assert.match(basic, /<div class="pikchr-rendering"><div class="pikchr-error" role="alert"><pre>Pikchr error at line 2[^]*<\/div><pre><code class="language-pikchr" dir="auto">box\nnonsense here\n<\/code><\/pre>/);
  assert.equal((basic.match(/<div class="pikchr-fence /g) ?? []).length, 2, 'one wrapper per claimed fence, none for the swift fence');
  assert.equal((basic.match(/<pre><code class="language-pikchr" dir="auto">/g) ?? []).length, 2, 'no sync attributes on the source <code>');
  for (const line of ['0', '8']) assert.equal((basic.match(new RegExp(`data-line="${line}"`, 'g')) ?? []).length, 1, `one scroll-sync element for the fence at line ${line}`);

  const attributed = await render(
    '```pikchr {alt="A box" caption="Figure 1: <box>" align="center" class=\'wide"><img src=x>\'}\nbox\n```'
  );
  assert.match(attributed, /<figure class="pikchr-figure pikchr-align-center"><div role="img" aria-label="A box"><svg /);
  assert.match(attributed, /class="pikchr wide&quot;&gt;&lt;img src=x&gt;"/);
  assert.match(attributed, /<figcaption>Figure 1: &lt;box&gt;<\/figcaption>/);
  assert.doesNotMatch(attributed, /<img/);

  const printed = await render('```pikchr\nprint "<b>note</b>"\nbox\n```');
  assert.match(printed, /<div class="pikchr-notes">&lt;b&gt;note&lt;\/b&gt;<\/div><svg /);

  // Nine levels of ten calls to an empty macro run past any budget; the runtime must survive it.
  let runaway = 'define m0 {}\n';
  for (let level = 1; level <= 9; level++) runaway += `define m${level} {${Array(10).fill(`m${level - 1}`).join(' ')}}\n`;
  runaway += 'm9';
  assert.match(await render('```pikchr\n' + runaway + '\n```'), /pikchr-error[^]*took longer than 3000 ms/);
  assert.match(await render('```pikchr\nbox\n```'), /<svg /);

  console.log('Extension host PASS: ' + vscode.version + ' from ' + extension.extensionPath +
    ': diagrams, attributes, class escaping, errors, print notes, timeout recovery, other fences, the view toggle wrapper and its delegated source view.');
};
