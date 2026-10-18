import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import { themeSelected, thingSelected } from '../src/store/actions.js';
import { CanvasPreview } from '../src/components/CanvasPreview.jsx';

// B06 / B07 / B08 - #canvasPreview carries the theme background, the object image
// resolves under /images/objects/, and a placeholder paints before the full asset.

// jsdom never fires image loads, so Image is stubbed with a handle that lets each test
// decide when the asset arrives. The getter mirrors the real IDL attribute: it hands back
// the resolved absolute URL, which is what the shipped component stores in state.
let pending;

const resolved = (path) => new URL(path, window.location.href).href;

function stubImageLoading() {
  pending = [];
  class FakeImage {
    set src(value) {
      this.authored = value;
      pending.push(this);
    }

    get src() {
      return resolved(this.authored);
    }
  }
  vi.stubGlobal('Image', FakeImage);
}

function resolveImages() {
  act(() => {
    for (const image of pending) image.onload?.();
  });
}

// React assigns inline colours through the CSSOM, so jsdom hands them back in rgb() form.
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
}

function backgroundOf(view) {
  return view.container.querySelector('#canvasPreview').style.backgroundColor;
}

function mount(store) {
  return render(
    <Provider store={store}>
      <CanvasPreview />
    </Provider>,
  );
}

beforeEach(() => {
  stubImageLoading();
});

afterEach(() => {
  vi.unstubAllGlobals();
  pending = [];
});

describe('B06 #canvasPreview carries the theme', () => {
  it('paints the active theme background onto the raster target', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const box = view.container.querySelector('#canvasPreview');
    expect(box).not.toBeNull();
    expect(backgroundOf(view)).toBe(rgb('#4CFC4F'));
    expect(box.style.backgroundSize).toBe('100%');
  });

  it('positions the theme image the way the shipped style object does', () => {
    // jsdom's CSSOM silently drops `background-position: top left` (the reversed keyword
    // order browsers accept), so read the inline style off a server render instead.
    const store = createStore(rootReducer);
    const markup = renderToStaticMarkup(
      <Provider store={store}>
        <CanvasPreview />
      </Provider>,
    );
    expect(markup).toContain('background-position:top left');
  });

  it('re-reads the theme from the store rather than the table, so the default quirk shows', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    // the initial theme is the hand-written literal, whose themeName disagrees with the
    // table row of the same id - the original ships both, so the panel must paint the
    // literal's colours while the store still carries the table for the grids.
    expect(backgroundOf(view)).toBe(rgb('#4CFC4F'));
    expect(store.getState().activeTheme.id).toBe(3);
    expect(store.getState().activeTheme.themeName).toBe('Blue + Yellow');
    expect(store.getState().themes[2].themeName).toBe('Darker Blue + yellow');
  });

  it('negative: switching theme updates the box but does not touch the object image', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const before = store.getState().activeThing.resourceUrl;
    act(() => store.dispatch(themeSelected(store.getState().themes[5])));
    expect(backgroundOf(view)).toBe(rgb('#47FD98'));
    expect(store.getState().activeThing.resourceUrl).toBe(before);
  });
});

describe('B07 object image path', () => {
  it('resolves the full object under /images/objects/', () => {
    const store = createStore(rootReducer);
    mount(store);
    expect(pending[0].authored).toBe('/images/objects/thenight.png');
  });

  it('resolves the placeholder under /images/objects/placeholders/', () => {
    const store = createStore(rootReducer);
    mount(store);
    // the placeholder path is requested eagerly by the same component
    const view = mount(createStore(rootReducer));
    expect(view.container.querySelector('img').getAttribute('src')).toBe('/images/objects/placeholders/thenight.png');
  });

  it('follows the selected thing, not the table order', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    act(() => store.dispatch(thingSelected(store.getState().things.find((thing) => thing.resourceUrl === 'cactus.png'))));
    resolveImages();
    // the shipped class stores image.src, so the painted attribute is the resolved URL
    expect(view.container.querySelector('img').getAttribute('src')).toBe(
      resolved('/images/objects/cactus.png'),
    );
  });
});

describe('B08 progressive placeholder swap', () => {
  it('shows the placeholder first, then swaps to the full asset once it loads', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const img = view.container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/images/objects/placeholders/thenight.png');

    resolveImages();
    expect(view.container.querySelector('img').getAttribute('src')).toBe(
      resolved('/images/objects/thenight.png'),
    );
  });

  it('negative: a src change repaints the placeholder before the new asset loads', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    resolveImages();
    act(() => store.dispatch(thingSelected(store.getState().things.find((thing) => thing.resourceUrl === 'cactus.png'))));
    expect(view.container.querySelector('img').getAttribute('src')).toBe(
      '/images/objects/placeholders/cactus.png',
    );
    resolveImages();
    expect(view.container.querySelector('img').getAttribute('src')).toBe(
      resolved('/images/objects/cactus.png'),
    );
  });

  it('emits the literal class "false" once loaded - the shipped concat(isLoading && "loading") behaviour', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    expect(view.container.querySelector('img').className).toBe('c-canvasPreviewBox--image loading');
    resolveImages();
    // 'loading' -> false -> stringified into the class list by the original's concat
    expect(view.container.querySelector('img').className).toBe('c-canvasPreviewBox--image false');
  });

  it('negative: alt stays empty on the canvas image, unlike the grid cells', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    resolveImages();
    expect(view.container.querySelector('img').getAttribute('alt')).toBe('');
  });
});

describe('canvas text layer', () => {
  it('author uses the contrast colour and gets no inline font-size (dead playlistAuthorFontSize lookup)', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const author = view.container.querySelector('input.c-canvasPreview--author');
    expect(author.value).toBe('Unapologetically Replaceable');
    expect(author.style.color).toBe('rgb(182, 70, 255)');
    expect(author.style.fontSize).toBe('');
    expect(author.style.textAlign).toBe('center');
    expect(author.getAttribute('spellcheck')).toBe('false');
  });

  it('title uses the text colour at the store size, and mirrors into the screenshot paragraph', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const textarea = view.container.querySelector('textarea.c-canvasPreview--textarea');
    expect(textarea.value).toBe('Unapologetically Replaceable');
    expect(textarea.style.fontSize).toBe('60px');
    const paragraph = view.container.querySelector('.c-canvasPreview--title-screenshot p');
    expect(paragraph.textContent).toBe('Unapologetically Replaceable');
    expect(paragraph.style.fontSize).toBe('60px');
  });

  it('pill takes the alignment class and the contrast background', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const pill = view.container.querySelector('.c-canvasPreview--pill');
    expect(pill.className).toBe('c-canvasPreview--pill center');
    expect(pill.style.background).toBe('rgb(182, 70, 255)');
  });

  it('typing the author re-sends the title unchanged, because COPY_CHANGED has no merging', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const author = view.container.querySelector('input.c-canvasPreview--author');
    fireEvent.change(author, { target: { value: 'Ed Sheeran' } });
    expect(store.getState().activeCopy).toEqual({
      playlistAuthor: 'Ed Sheeran',
      playlistTitle: 'Unapologetically Replaceable',
    });
  });

  it('size changes flow to both the textarea and the screenshot paragraph', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    act(() => store.dispatch({ type: 'TEXT_SIZE_CHANGED', payload: { size: 44 } }));
    expect(view.container.querySelector('textarea.c-canvasPreview--textarea').style.fontSize).toBe('44px');
    expect(view.container.querySelector('.c-canvasPreview--title-screenshot p').style.fontSize).toBe('44px');
  });

  it('alignment changes flow to author, title, paragraph and pill together', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    act(() => store.dispatch({ type: 'TEXT_ALIGNMENT_CHANGED', payload: { alignment: 'right' } }));
    expect(view.container.querySelector('input.c-canvasPreview--author').style.textAlign).toBe('right');
    expect(view.container.querySelector('textarea.c-canvasPreview--textarea').style.textAlign).toBe('right');
    expect(view.container.querySelector('.c-canvasPreview--title-screenshot p').style.textAlign).toBe('right');
    expect(view.container.querySelector('.c-canvasPreview--pill').className).toBe('c-canvasPreview--pill right');
  });
});
