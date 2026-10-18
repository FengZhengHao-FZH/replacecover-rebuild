import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import analytics from '../lib/analytics.js';
import { randomIndexBelow } from '../lib/random.js';
import {
  copyChanged,
  themeSelected,
  thingSelected,
} from '../store/actions.js';

// main.js:1:14110-14680 (`O`).
export function ShuffleTool() {
  const themes = useSelector((state) => state.themes);
  const things = useSelector((state) => state.things);
  const playlistNames = useSelector((state) => state.randomPlaylistNames);
  const dispatch = useDispatch();

  function shuffle() {
    // The shipped code calls the random index twice inside one object literal, so the
    // author and the title are drawn independently and can land on different rows.
    // That is the original behaviour, so it is reproduced rather than unified.
    dispatch(
      copyChanged({
        playlistAuthor: playlistNames[randomIndexBelow(playlistNames.length - 1)].author,
        playlistTitle: playlistNames[randomIndexBelow(playlistNames.length - 1)].title,
      }),
    );
    dispatch(themeSelected(themes[randomIndexBelow(themes.length)]));
    dispatch(thingSelected(things[randomIndexBelow(things.length)]));
    analytics.event({ category: 'Covers', action: 'Shuffled' });
  }

  return (
    <div className="c-tools-section c-tools-Shuffle">
      <div
        className="c-tools-section--action"
        onClick={() => shuffle()}
        onKeyPress={() => shuffle()}
        tabIndex="0"
        role="button"
        aria-label="Shuffle Cover Design"
      >
        <span className="ic ic-shuffle ic-shuffle-dims" />
      </div>
    </div>
  );
}
