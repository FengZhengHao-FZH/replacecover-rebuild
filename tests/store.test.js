import { describe, expect, it } from 'vitest';
import { rootReducer } from '../src/store/index.js';
import {
  themeSelected,
  thingSelected,
  copyChanged,
  textSizeChanged,
  textAlignmentChanged,
} from '../src/store/actions.js';

// Each reducer pair below is the fixture set the ledger demands: a positive case that
// the documented action replaces the slice, and a negative case that no other action
// touches it. Both directions matter - without the negative one, a reducer that
// clobbered state on every action would still pass.

describe('B01 activeTheme / THEME_SELECTED', () => {
  it('positive: replaces the whole theme object', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const picked = { id: 7, themeName: 'x', backgroundColor: '#111111', textColor: '#222222', contrastColor: '#333333' };
    const result = rootReducer(initial, themeSelected(picked));
    expect(result.activeTheme).toEqual(picked);
  });

  it('negative: an unrelated action leaves it untouched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const after = rootReducer(initial, { type: 'SOMETHING_ELSE' });
    expect(after.activeTheme).toBe(initial.activeTheme);
  });
});

describe('B02 activeThing / THING_SELECTED', () => {
  it('positive: replaces the whole thing object', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const picked = { id: 20, thingName: 'cupcake', resourceUrl: 'cupcake.png', defaultIndex: 0 };
    expect(rootReducer(initial, thingSelected(picked)).activeThing).toEqual(picked);
  });

  it('negative: an unrelated action leaves it untouched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, { type: 'SOMETHING_ELSE' }).activeThing).toBe(initial.activeThing);
  });
});

describe('B03 activeCopy / COPY_CHANGED', () => {
  it('positive: both author and title are written from the payload', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const next = rootReducer(initial, copyChanged({ playlistAuthor: 'A', playlistTitle: 'T' }));
    expect(next.activeCopy).toEqual({ playlistAuthor: 'A', playlistTitle: 'T' });
  });

  it('negative: COPY_CHANGED carries the whole object, so a half payload really does erase the other half', () => {
    // This is the shipped behaviour - the bundle has no merging, which is why every
    // call site has to re-send the field it is not changing.
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const withBoth = rootReducer(initial, copyChanged({ playlistAuthor: 'A', playlistTitle: 'T' }));
    const half = rootReducer(withBoth, copyChanged({ playlistAuthor: 'B' }));
    expect(half.activeCopy).toEqual({ playlistAuthor: 'B' });
    expect(half.activeCopy.playlistTitle).toBeUndefined();
  });

  it('negative: an unrelated action leaves it untouched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, { type: 'SOMETHING_ELSE' }).activeCopy).toBe(initial.activeCopy);
  });
});

describe('B04 textSize / TEXT_SIZE_CHANGED', () => {
  it('positive: payload replaces the size object', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, textSizeChanged({ size: 44 })).textSize).toEqual({ size: 44 });
  });

  it('negative: an unrelated action leaves it untouched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, { type: 'SOMETHING_ELSE' }).textSize).toBe(initial.textSize);
  });
});

describe('B05 textAlignment / TEXT_ALIGNMENT_CHANGED', () => {
  it('positive: payload replaces the alignment object', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, textAlignmentChanged({ alignment: 'left' })).textAlignment).toEqual({ alignment: 'left' });
  });

  it('negative: an unrelated action leaves it untouched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(rootReducer(initial, { type: 'SOMETHING_ELSE' }).textAlignment).toBe(initial.textAlignment);
  });
});

describe('B15 initial state', () => {
  const initial = rootReducer(undefined, { type: '@@INIT' });

  it('title size is 60 and alignment is center', () => {
    expect(initial.textSize).toEqual({ size: 60 });
    expect(initial.textAlignment).toEqual({ alignment: 'center' });
  });

  it('has exactly the eight shipped slices', () => {
    expect(Object.keys(initial).sort()).toEqual([
      'activeCopy', 'activeTheme', 'activeThing', 'randomPlaylistNames',
      'textAlignment', 'textSize', 'themes', 'things',
    ]);
  });

  // The two authentic divergences. These fail the moment anyone "tidies up" the
  // defaults to match the tables, which is exactly the edit that would break parity
  // with the captured first paint.
  it('default theme name disagrees with the themes row of the same id', () => {
    const row = initial.themes.find((theme) => theme.id === initial.activeTheme.id);
    expect(initial.activeTheme.themeName).toBe('Blue + Yellow');
    expect(row.themeName).toBe('Darker Blue + yellow');
    // colours still match, which is why the bug is only visible in the label
    expect(initial.activeTheme.backgroundColor).toBe(row.backgroundColor);
    expect(initial.activeTheme.textColor).toBe(row.textColor);
    expect(initial.activeTheme.contrastColor).toBe(row.contrastColor);
  });

  it('default thing name disagrees with its own resourceUrl', () => {
    const row = initial.things.find((thing) => thing.id === initial.activeThing.id);
    expect(initial.activeThing.thingName).toBe('Avocado');
    expect(initial.activeThing.resourceUrl).toBe('thenight.png');
    expect(row.thingName).toBe('thenight');
    expect(initial.activeThing.defaultIndex).toBe(1);
    expect(row.defaultIndex).toBe(0);
  });
});

describe('B12 themes table', () => {
  const initial = rootReducer(undefined, { type: '@@INIT' });

  it('carries 15 rows with contiguous ids 1..15', () => {
    expect(initial.themes).toHaveLength(15);
    expect(initial.themes.map((theme) => theme.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('every row has the four colour/name fields and hex values', () => {
    for (const theme of initial.themes) {
      expect(Object.keys(theme).sort()).toEqual(['backgroundColor', 'contrastColor', 'id', 'textColor', 'themeName']);
      for (const field of ['backgroundColor', 'contrastColor', 'textColor']) {
        expect(theme[field]).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it('only the first row is named "Blue + Yellow"', () => {
    const named = initial.themes.filter((theme) => theme.themeName === 'Blue + Yellow');
    expect(named).toHaveLength(1);
    expect(named[0].id).toBe(1);
  });
});

describe('B13 things table', () => {
  const initial = rootReducer(undefined, { type: '@@INIT' });

  it('carries 61 rows spanning ids 1..63 with 46 and 58 absent', () => {
    expect(initial.things).toHaveLength(61);
    const ids = initial.things.map((thing) => thing.id);
    expect(ids).not.toContain(46);
    expect(ids).not.toContain(58);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(63);
  });

  it('only the first 14 rows carry a thingName', () => {
    const named = initial.things.filter((thing) => thing.thingName !== '');
    expect(named).toHaveLength(14);
    expect(named.map((thing) => thing.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('preserves the original spellings rather than correcting them', () => {
    const names = initial.things.map((thing) => thing.thingName);
    expect(names).toContain('Baloon');
    expect(names).not.toContain('Balloon');
    expect(names).toContain('sould');
    expect(names).not.toContain('soul');
  });

  it('id 1 avocado.png is the only table row with a non-zero defaultIndex', () => {
    const nonZero = initial.things.filter((thing) => thing.defaultIndex !== 0);
    expect(nonZero).toHaveLength(1);
    expect(nonZero[0].resourceUrl).toBe('avocado.png');
  });

  it('every resourceUrl is a bare png filename resolved by the /images/objects prefix', () => {
    for (const thing of initial.things) {
      expect(thing.resourceUrl).toMatch(/^[A-Za-z0-9_-]+\.png$/);
    }
  });
});

describe('B14 randomPlaylistNames pool', () => {
  const initial = rootReducer(undefined, { type: '@@INIT' });

  it('carries 35 rows of id/author/title', () => {
    expect(initial.randomPlaylistNames).toHaveLength(35);
    for (const row of initial.randomPlaylistNames) {
      expect(Object.keys(row).sort()).toEqual(['author', 'id', 'title']);
    }
  });

  it('every author is the literal "This Is" - the pool is titles only', () => {
    const authors = new Set(initial.randomPlaylistNames.map((row) => row.author));
    expect([...authors]).toEqual(['This Is']);
  });
});

describe('constant slices cannot be changed by any action', () => {
  const initial = rootReducer(undefined, { type: '@@INIT' });

  it('themes / things / randomPlaylistNames are thunks that ignore actions', () => {
    for (const action of [themeSelected({ id: 99 }), thingSelected({ id: 99 }), { type: 'SOMETHING_ELSE' }]) {
      const next = rootReducer(initial, action);
      expect(next.themes).toBe(initial.themes);
      expect(next.things).toBe(initial.things);
      expect(next.randomPlaylistNames).toBe(initial.randomPlaylistNames);
    }
  });
});
