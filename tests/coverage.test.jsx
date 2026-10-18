import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import Home from '../src/components/Home.jsx';

// B11 / B15 at the level the ledger asks for: which slices the shipped UI can actually
// reach, and which it can never change. The five reducers cover everything the user can
// touch; themes, things and randomPlaylistNames are constant slices, and B11's four
// independent draws land on exactly those five reachable slices.

function mount() {
  const store = createStore(rootReducer);
  const view = render(
    <Provider store={store}>
      <Home />
    </Provider>,
  );
  const tool = (label) => view.container.querySelector('[aria-label="'.concat(label, '"]'));
  return { store, view, tool };
}

function press(node) {
  act(() => node.click());
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('B11 shuffle reaches every mutable slice', () => {
  it('positive: one click moves copy, theme and thing at the same time', () => {
    const { store, tool } = mount();
    const before = store.getState();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    press(tool('Shuffle Cover Design'));

    const after = store.getState();
    expect(after.activeTheme.id).not.toBe(before.activeTheme.id);
    expect(after.activeThing.resourceUrl).not.toBe(before.activeThing.resourceUrl);
    expect(after.activeCopy.playlistTitle).not.toBe(before.activeCopy.playlistTitle);
    expect(after.activeCopy.playlistAuthor).toBe('This Is');
  });

  it('positive: the draws are independent, so size and alignment are left alone', () => {
    const { store, tool } = mount();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    press(tool('Shuffle Cover Design'));
    expect(store.getState().textSize.size).toBe(60);
    expect(store.getState().textAlignment.alignment).toBe('center');
  });

  it('negative: shuffle never touches the tables it draws from', () => {
    const { store, tool } = mount();
    const before = store.getState();

    for (const value of [0, 0.25, 0.5, 0.75, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(value);
      press(tool('Shuffle Cover Design'));
    }
    const after = store.getState();
    expect(after.themes).toHaveLength(before.themes.length);
    expect(after.things).toHaveLength(before.things.length);
    expect(after.randomPlaylistNames).toHaveLength(before.randomPlaylistNames.length);
    // the constant slices keep their reducer's literal: same object identity, so no copy
    // of the table is ever rebuilt
    expect(after.themes).toBe(before.themes);
    expect(after.things).toBe(before.things);
    expect(after.randomPlaylistNames).toBe(before.randomPlaylistNames);
  });
});

describe('B15 the tools are the only route into the mutable slices', () => {
  it('positive: text size steps by four in each direction', () => {
    const { store, tool } = mount();
    press(tool('Increase text size'));
    expect(store.getState().textSize.size).toBe(64);
    press(tool('Decrease text size'));
    press(tool('Decrease text size'));
    expect(store.getState().textSize.size).toBe(56);
  });

  it('negative: the step has no clamp, so the size can go negative as it did upstream', () => {
    const { store, tool } = mount();
    for (let i = 0; i < 16; i += 1) press(tool('Decrease text size'));
    expect(store.getState().textSize.size).toBe(-4);
    expect(
      store.getState().textAlignment.alignment,
      'shrinking the text must not disturb alignment',
    ).toBe('center');
  });

  it('positive: alignment is a choice of three, not a cycle', () => {
    const { store, tool } = mount();
    press(tool('Align text to left'));
    expect(store.getState().textAlignment.alignment).toBe('left');
    press(tool('Align text to right'));
    expect(store.getState().textAlignment.alignment).toBe('right');
    press(tool('Align text to center'));
    expect(store.getState().textAlignment.alignment).toBe('center');
  });

  it('positive: the chosen alignment marks its own button active', () => {
    const { view, tool } = mount();
    press(tool('Align text to right'));
    expect(view.container.querySelector('.c-tools-TextAlignment').children[2].className).toBe(
      'c-tools-section--action active',
    );
    expect(view.container.querySelector('.c-tools-TextAlignment').children[0].className).toBe(
      'c-tools-section--action ',
    );
  });

  it('negative: keyboard activation is the same dispatch as the click', () => {
    const { store, tool } = mount();
    act(() =>
      fireEvent.keyPress(tool('Increase text size'), { key: 'Enter', charCode: 13 }),
    );
    expect(store.getState().textSize.size).toBe(64);
  });

  it('positive: choosing a theme repaints the canvas and the aside together', () => {
    const { store, view } = mount();
    const theme = store.getState().themes[7];
    expect(theme.backgroundColor).toBe('#F84A02');

    act(() => store.dispatch({ type: 'THEME_SELECTED', payload: theme }));
    expect(view.container.querySelector('#canvasPreview').style.backgroundColor).toBe(
      'rgb(248, 74, 2)',
    );
    expect(view.container.querySelector('.s-aside h1').style.color).toBe('rgb(248, 74, 2)');
    expect(view.container.querySelector('.c-tools-Download .c-tools-section--action').style
      .background).toBe('rgb(248, 74, 2)');
  });
});
