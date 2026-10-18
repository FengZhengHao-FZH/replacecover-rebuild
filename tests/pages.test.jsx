import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../src/App.jsx';
import { store } from '../src/store/index.js';
import { formatLongDate } from '../src/lib/formatLongDate.js';
import analytics from '../src/lib/analytics.js';
import { AboutPage } from '../src/components/Pages.jsx';
import AboutPageContent from '../src/data/pageTrees.json';

// B20 routing, B23 the one-shot Tab handler, and the changelog date contract.
//
// The reconstruction drives BrowserRouter from window.location, so each case pushes the
// route it wants exercised before mounting.

function at(path) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.className = '';
  window.history.pushState({}, '', '/');
});

describe('B20 routes', () => {
  it('positive: / mounts the editor, canvas and aside', () => {
    const view = at('/');
    expect(view.container.querySelector('.v-home')).not.toBeNull();
    expect(view.container.querySelector('#canvasPreview')).not.toBeNull();
    expect(view.container.querySelectorAll('.c-smallThingsBox')).toHaveLength(61);
    expect(view.container.textContent).toContain('Create cool album art');
  });

  it('positive: /about mounts the recovered document tree', () => {
    const view = at('/about');
    expect(view.container.querySelector('.v-home')).toBeNull();
    expect(view.container.textContent).toContain('Replace Cover');
    expect(view.container.textContent).toContain('Spotify');
  });

  it('positive: /changelog mounts the two shipped entries', () => {
    const view = at('/changelog');
    expect(view.container.querySelector('.v-home')).toBeNull();
    expect(view.container.textContent).toContain('Changelog');
    expect(view.container.textContent).toContain('August 15th, 2020');
    expect(view.container.textContent).toContain('March 12th, 2018');
  });

  it('negative: exact routes do not answer a prefixed path', () => {
    const view = at('/about/roadmap');
    expect(view.container.querySelector('.v-home')).toBeNull();
    expect(view.container.textContent).toBe('');
  });

  it('negative: the page chrome is the same element on every route', () => {
    const view = at('/changelog');
    expect(view.container.querySelector('.s-page')).not.toBeNull();
    expect(store.getState().textSize.size).toBe(60);
  });
});

describe('changelog date formatting', () => {
  it('positive: the helper reproduces the format string found in the artifact', () => {
    const bundle = readFileSync(
      resolve(process.cwd(), '../replacecover/site/static/js/main.3962a231.chunk.js'),
      'utf8',
    );
    expect(bundle).toContain('MMMM Do, Y');
    expect(formatLongDate('Aug 15 2020')).toBe('August 15th, 2020');
    expect(formatLongDate('March 12 2018')).toBe('March 12th, 2018');
  });

  it('negative: ordinals follow the day, not the position in the list', () => {
    expect(formatLongDate('Nov 1 2019')).toBe('November 1st, 2019');
    expect(formatLongDate('Sep 2 2019')).toBe('September 2nd, 2019');
    expect(formatLongDate('Oct 3 2019')).toBe('October 3rd, 2019');
    expect(formatLongDate('May 11 2019')).toBe('May 11th, 2019');
    expect(formatLongDate('June 12 2019')).toBe('June 12th, 2019');
  });
});

describe('B23 one-shot tab marker', () => {
  it('positive: the first Tab press marks the body', () => {
    at('/');
    expect(document.body.classList.contains('user-is-tabbing')).toBe(false);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 9 })));
    expect(document.body.classList.contains('user-is-tabbing')).toBe(true);
  });

  it('positive: the handler detaches, so a later Tab after the class is gone stays gone', () => {
    at('/');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 9 })));
    document.body.classList.remove('user-is-tabbing');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 9 })));
    expect(document.body.classList.contains('user-is-tabbing')).toBe(false);
  });

  it('negative: any other key leaves the body alone', () => {
    at('/');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 })));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })));
    expect(document.body.classList.contains('user-is-tabbing')).toBe(false);
  });
});

describe('recovered accessibility labels', () => {
  // role="img" emoji spans carry a quoted hyphenated key in the bundle ({"aria-label":"back"}).
  // An extractor that only accepted identifier keys silently dropped all of them, so these
  // labels are asserted against the values read out of main.3962a231.chunk.js (offsets
  // 19188/20160/20393/20628 for About, 26422 for Changelog).
  const labelsOf = (view) =>
    [...view.container.querySelectorAll('span[role="img"]')].map((node) =>
      node.getAttribute('aria-label'));

  it('positive: About labels every emoji span the original labelled', () => {
    expect(labelsOf(at('/about'))).toEqual(['back', 'hello', 'email', 'kudos']);
  });

  it('positive: Changelog labels its back link', () => {
    expect(labelsOf(at('/changelog'))).toEqual(['back']);
  });

  it('negative: an unlabelled role=img span would be read as a bare glyph', () => {
    const view = at('/about');
    const bare = view.container.querySelector('span[role="img"]:not([aria-label])');
    expect(bare).toBeNull();
  });
});

describe('recovered page trees', () => {
  it('positive: the tree file carries both documents and no unparsed leftovers', () => {
    const nodes = JSON.stringify(AboutPageContent);
    expect(nodes).toContain('about');
    expect(nodes).toContain('changelog');
    expect(nodes).not.toContain('_unparsed');
    expect(nodes).not.toContain('_expression');
  });

  it('negative: the GA pageview fires in the render body but paints nothing', () => {
    const pageview = vi.spyOn(analytics, 'pageview').mockImplementation(() => {});
    const view = render(<AboutPage />);
    expect(pageview).toHaveBeenCalledWith('/about');
    // the shipped code rendered pageview()'s undefined return as a trailing child; the
    // recovered tree keeps it as a pageviewChild marker, which must not become a node.
    expect(view.container.childElementCount).toBe(1);
    expect(view.container.textContent).toContain('Replace Cover');
  });
});
