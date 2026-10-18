import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import { thingSelected } from '../src/store/actions.js';
import { ThingsGrid } from '../src/components/ThingsGrid.jsx';
import { Editor } from '../src/components/Editor.jsx';

// B24 - the grids mount only the cells the viewport can see. The shipped app used
// react-lazyload, whose wrapper span stays in the DOM in both states, so the tests assert
// the observed shape rather than an implementation detail.

function mountGrid() {
  const store = createStore(rootReducer);
  const view = render(
    <Provider store={store}>
      <ThingsGrid />
    </Provider>,
  );
  return { store, view };
}

function cellsOf(view) {
  return view.container.querySelectorAll('.c-smallThingsBox');
}

beforeEach(() => {
  globalThis.__intersectionObservers.length = 0;
});

describe('B24 lazy grid mounting', () => {
  it('positive: revealing the viewport mounts an image per cell', () => {
    const { view } = mountGrid();
    expect(cellsOf(view)).toHaveLength(61);
    expect(view.container.querySelectorAll('img')).toHaveLength(0);

    act(() => globalThis.__revealAllLazyCells());
    expect(view.container.querySelectorAll('img')).toHaveLength(61);
  });

  it('positive: a mounted cell paints the placeholder first', () => {
    const { view, store } = mountGrid();
    act(() => globalThis.__revealAllLazyCells());
    const first = view.container.querySelector('img');
    expect(first.getAttribute('src')).toBe(
      '/images/objects/placeholders/'.concat(store.getState().things[0].resourceUrl),
    );
    expect(first.className).toContain('loading');
  });

  it('positive: only the intersecting cell mounts, and a mounted cell drops the wrapper', () => {
    const { view } = mountGrid();
    // the lazy slot is the third child of a cell, between the two contrast lines and the
    // two text lines. Unrevealed it is the react-lazyload placeholder span; revealed, the
    // image takes its place directly - both shapes come from captured originals.
    const slot = () => [...cellsOf(view)].map((cell) => cell.children[2]);
    expect(slot().every((node) => node.tagName === 'SPAN' && node.childNodes.length === 0)).toBe(true);
    expect(slot()[0].getAttribute('class')).toBe('');
    expect(slot()[0].getAttribute('style')).toBe('display: inline-block;');

    act(() => globalThis.__intersectionObservers[0].triggerAll());
    expect(view.container.querySelectorAll('img')).toHaveLength(1);
    expect(slot()[0].tagName).toBe('IMG');
    expect(slot().slice(1).every((node) => node.tagName === 'SPAN' && node.childNodes.length === 0)).toBe(true);
  });

  it('positive: cell order follows the table, so alt carries a name only for ids 1..14', () => {
    const { view } = mountGrid();
    act(() => globalThis.__revealAllLazyCells());
    const images = [...view.container.querySelectorAll('img')];
    expect(images[0].getAttribute('alt')).toBe('Avocado');
    expect(images[13].getAttribute('alt')).toBe('pug');
    expect(images[14].getAttribute('alt')).toBe('');
  });

  it('negative: selecting a thing re-renders the active cell without remounting images', () => {
    const { view, store } = mountGrid();
    act(() => globalThis.__revealAllLazyCells());
    const before = view.container.querySelectorAll('img').length;

    act(() => store.dispatch(thingSelected(store.getState().things[20])));
    expect(view.container.querySelectorAll('img')).toHaveLength(before);
    expect(cellsOf(view)[20].className).toBe('c-smallThingsBox active');
    expect(cellsOf(view)[0].className).toBe('c-smallThingsBox ');
  });

  it('negative: the second tab panel stays empty until it is selected', () => {
    const store = createStore(rootReducer);
    const view = render(
      <Provider store={store}>
        <Editor />
      </Provider>,
    );
    // only the selected panel mounts, matching the captured DOM
    expect(view.container.querySelectorAll('.c-smallThingsBoxGrid')).toHaveLength(1);
    expect(view.container.querySelectorAll('.c-smallPreviewBoxGrid')).toHaveLength(0);
    expect(view.container.querySelectorAll('.react-tabs__tab-panel')).toHaveLength(2);
    expect(view.container.querySelectorAll('.react-tabs__tab-panel')[1].children).toHaveLength(0);
  });
});
