import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import analytics from '../src/lib/analytics.js';
import { Aside } from '../src/components/Aside.jsx';

// B17 / B18 - the two obligations the ledger marks unavailable authority. Neither can be
// reproduced honestly (an Adobe-licensed kit, and somebody else's GA property), so the
// verifier binds to the documented gap instead: the reconstruction must stay free of the
// original's external dependencies rather than fake them.

const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8');

// The negative assertions are about executable code: this project's comments deliberately
// name the original's kit id, GA property and ReactSVG component as evidence, so prose is
// stripped before looking for them.
const codeOf = (relative) =>
  source(relative).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const hasBuild = existsSync(resolve(process.cwd(), 'dist/assets'));

describe('B17 typography substitution', () => {
  it('positive: the stylesheet asks for the self-hosted family', () => {
    const css = source('src/styles/original.css');
    expect(css).toContain('font-family:Poppins,-apple-system,"Helvetica Neue",sans-serif');
    expect(css).toContain('font-family:Poppins,"Helvetica Neue",Arial,sans-serif');
  });

  it('positive: four latin weights are imported from the font package', () => {
    const entry = source('src/main.jsx');
    for (const weight of [400, 500, 600, 700]) {
      expect(entry).toContain('@fontsource/poppins/latin-'.concat(weight, '.css'));
    }
  });

  it('positive: the built bundle carries the font files it names', () => {
    // needs `npm run build` first - this asserts on the artifact, not the source
    expect(hasBuild).toBe(true);
    const assets = readdirSync(resolve(process.cwd(), 'dist/assets'));
    expect(assets.filter((name) => name.endsWith('.woff2'))).toHaveLength(4);
    expect(source('dist/index.html')).not.toContain('use.typekit.net');
  });

  it('negative: no Adobe kit id or licensed family name survives in the source', () => {
    expect(codeOf('src/App.jsx')).not.toContain('szh8xsx');
    expect(codeOf('src/main.jsx')).not.toMatch(/[Tt]ypekit/);
    expect(codeOf('src/styles/original.css')).not.toContain('canada-type-gibson');
    expect(codeOf('package.json')).not.toContain('typekit');
  });
});

describe('B18 analytics stays inert', () => {
  it('positive: the call sites return nothing and set no global', () => {
    expect(analytics.pageview('/about')).toBeUndefined();
    expect(analytics.event({ category: 'Covers', action: 'Downloaded A Cover' })).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
    expect(window.ga).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it('negative: the original property id is not reused', () => {
    for (const file of ['src/main.jsx', 'src/App.jsx', 'index.html', 'src/lib/analytics.js']) {
      expect(codeOf(file)).not.toContain('UA-116318007-1');
    }
    expect(codeOf('package.json')).not.toContain('react-ga');
  });
});

describe('logo parity', () => {
  it('positive: the inlined mark keeps the captured structure', () => {
    const store = createStore(rootReducer);
    const view = render(
      <Provider store={store}>
        <Aside />
      </Provider>,
    );
    const svg = view.container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 124 32');
    expect(svg.querySelectorAll('rect')).toHaveLength(4);
    expect(svg.querySelectorAll('path')).toHaveLength(2);
    expect(svg.querySelectorAll('g')).toHaveLength(2);
  });

  it('positive: the pre-hydration loader still points at a file that ships', () => {
    // index.html keeps the shipped `content:url(/svg/logo.svg)` loader rule, so the same
    // mark has to exist under public/ or the first paint would be a broken image.
    expect(source('index.html')).toContain('content:url(/svg/logo.svg)');
    expect(existsSync(resolve(process.cwd(), 'public/svg/logo.svg'))).toBe(true);
  });

  it('negative: nothing fetches the logo at runtime', () => {
    expect(codeOf('src/components/Aside.jsx')).not.toContain('ReactSVG');
    expect(codeOf('package.json')).not.toContain('react-svg');
  });
});
