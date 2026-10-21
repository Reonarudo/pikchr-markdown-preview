const vscode = require('vscode');
const assert = require('node:assert/strict');
const path = require('node:path');

exports.run = async () => {
  const extension = vscode.extensions.getExtension('ReoX86.pikchr-diagram-preview');
  assert(extension, 'extension is installed');
  assert.equal(path.resolve(extension.extensionPath), path.resolve(process.env.PIKCHR_EXTENSION_PATH));
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
    ': diagrams, attributes, class escaping, errors, print notes, timeout recovery, other fences.');
};
