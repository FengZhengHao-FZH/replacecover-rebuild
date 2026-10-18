import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import { ShuffleTool } from '../src/components/ShuffleTool.jsx';
import { randomIndexBelow } from '../src/lib/random.js';

// B11 - shuffle redraws author, title, object and theme independently.
//
// The negative half is the point: the shipped index formula is
// Math.floor(Math.random() * (n - 1)), one short of the range, so the last entry of
// each pool is unreachable. Asserting that keeps the reconstruction honest about
// reproducing the original's off-by-one instead of quietly fixing it.

function mount(store) {
  return render(
    <Provider store={store}>
      <ShuffleTool />
    </Provider>,
  );
}

const shuffleButton = (view) => view.getByRole('button', { name: 'Shuffle Cover Design' });

// Math.random can never actually return 1, so 0.999999999999 is the practical ceiling.
const MAX = 0.999999999999;
const MIN = 0;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomIndexBelow - the shipped B helper', () => {
  it('is floor(rand * (n - 1)), one short of a full range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(MAX);
    expect(randomIndexBelow(15)).toBe(13);
    expect(randomIndexBelow(61)).toBe(59);
    expect(randomIndexBelow(35 - 1)).toBe(32);
  });

  it('is 0 at the bottom of the range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(MIN);
    expect(randomIndexBelow(15)).toBe(0);
  });
});

describe('B11 shuffle reachability', () => {
  it('never reaches the last theme (id 15), last thing (id 63), or last two titles', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const { themes, things, randomPlaylistNames } = store.getState();

    for (const seed of [MAX, 0.9999, 0.5, 0]) {
      vi.spyOn(Math, 'random').mockReturnValue(seed);
      fireEvent.click(shuffleButton(view));
      expect(store.getState().activeTheme.id).not.toBe(themes.at(-1).id);
      expect(store.getState().activeThing.id).not.toBe(things.at(-1).id);
    }

    // Confirm the unreachable rows are real rows, not an accident of the fixture.
    expect(themes.at(-1).id).toBe(15);
    expect(things.at(-1).resourceUrl).toBe('timer.png');
    expect(randomPlaylistNames).toHaveLength(35);
  });

  it('does reach the highest index the formula allows', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    vi.spyOn(Math, 'random').mockReturnValue(MAX);
    fireEvent.click(shuffleButton(view));
    const state = store.getState();
    expect(state.activeTheme).toEqual(state.themes[13]);
    expect(state.activeThing).toEqual(state.things[59]);
  });
});

describe('B11 independent draws', () => {
  it('draws twice for the copy, but the double draw is not user-visible with the shipped pool', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    const names = store.getState().randomPlaylistNames;

    // The shipped literal calls B() twice - once for author, once for title - so the two
    // fields CAN come from different rows. Every row's author is the same string
    // ("This Is"), so for this data the divergence is not observable; the assertion that
    // holds is that two draws happen and the title follows the second one.
    const draws = [MAX, MIN];
    let call = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const value = draws[Math.min(call, draws.length - 1)];
      call += 1;
      return value;
    });

    fireEvent.click(shuffleButton(view));

    const { playlistAuthor, playlistTitle } = store.getState().activeCopy;
    expect(call).toBeGreaterThanOrEqual(2);
    expect(playlistAuthor).toBe(names[32].author);
    expect(playlistTitle).toBe(names[0].title);
    expect(new Set(names.map((row) => row.author)).size).toBe(1);
  });

  it('also redraws theme and thing, in that order, after the copy', () => {
    const store = createStore(rootReducer);
    const view = mount(store);
    vi.spyOn(Math, 'random').mockReturnValue(MIN);
    fireEvent.click(shuffleButton(view));
    const state = store.getState();
    expect(state.activeTheme).toBe(state.themes[0]);
    expect(state.activeThing).toBe(state.things[0]);
  });

  it('leaves the pools themselves untouched - shuffle only rewrites the active slices', () => {
    const store = createStore(rootReducer);
    const before = store.getState();
    const view = mount(store);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    fireEvent.click(shuffleButton(view));
    const after = store.getState();
    expect(after.themes).toBe(before.themes);
    expect(after.things).toBe(before.things);
    expect(after.randomPlaylistNames).toBe(before.randomPlaylistNames);
  });
});
