// Derive rebuild/index.html from the captured specimen so the head metadata (title,
// description, OG/Twitter tags, favicon and manifest links, and the inline pre-hydration
// loader <style>) is reproduced without retyping it. Only the runtime wiring changes:
// the CRA webpack bootstrap and the hashed asset links are replaced by the Vite entry.
import fs from 'node:fs';

const SOURCE = 'replacecover/site/index.html';
const TARGET = 'rebuild/index.html';

let html = fs.readFileSync(SOURCE, 'utf8');

const before = html.length;

// Drop the hashed CSS link and both webpack runtime/chunk scripts.
html = html.replace(/<link href="\/static\/css\/[^"]+" rel="stylesheet">/g, '');
html = html.replace(/<script>[\s\S]*?<\/script>/g, '');
html = html.replace(/<script src="\/static\/js\/[^"]+"><\/script>/g, '');

// Vite injects the CSS imported by the entry, so only the module tag is needed.
html = html.replace('</body>', '<script type="module" src="/src/main.jsx"></script></body>');

for (const leftover of ['/static/js/', '/static/css/', 'webpackJsonp', 'web.archive.org']) {
  if (html.includes(leftover)) throw new Error('specimen wiring left in place: ' + leftover);
}

fs.writeFileSync(TARGET, html);
console.log('wrote', TARGET, 'source bytes', before, '-> output bytes', html.length);
console.log('script tags:', (html.match(/<script/g) || []).length);
console.log('meta tags:', (html.match(/<meta/g) || []).length);
console.log('link tags:', (html.match(/<link/g) || []).length);
