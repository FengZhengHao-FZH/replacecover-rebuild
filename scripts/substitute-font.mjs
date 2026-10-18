// The shipped stylesheet is copied verbatim except for one deliberate substitution:
// canada-type-gibson is an Adobe-licensed family served by use.typekit.net (kit szh8xsx),
// which is unreachable and not redistributable. Poppins is OFL and self-hostable, so it
// replaces the family token in exactly the two declarations that name it.
// This script regenerates original.css -> fonts-substituted.css and fails if anything
// other than those two tokens changed.
import fs from 'node:fs';

const SOURCE = 'replacecover/site/static/css/main.39f91e43.chunk.css';
const TARGET = 'rebuild/src/styles/original.css';

const css = fs.readFileSync(SOURCE, 'utf8');
const substituted = css
  .split('font-family:"canada-type-gibson"').join('font-family:Poppins')
  .split('font-family:canada-type-gibson').join('font-family:Poppins');

const remaining = (substituted.match(/canada-type-gibson/g) || []).length;
if (remaining !== 0) throw new Error('unsubstituted canada-type-gibson remains: ' + remaining);

const diff = css.length - substituted.length;
// one quoted (21 -> 7) and one bare (19 -> 7) occurrence
const expected = 'font-family:"canada-type-gibson"'.length + 'font-family:canada-type-gibson'.length
  - 2 * 'font-family:Poppins'.length;
if (diff !== expected) {
  throw new Error('unexpected byte delta ' + diff + ' (expected ' + expected + ') - more than the two tokens changed');
}

fs.writeFileSync(TARGET, substituted);
console.log('substituted 2 family tokens, byte delta', diff);
console.log('canada-type-gibson remaining:', remaining);
console.log('Poppins declarations:', (substituted.match(/font-family:Poppins/g) || []).length);
