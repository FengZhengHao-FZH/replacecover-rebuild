import { themes } from '../data/themes.js';
import { things } from '../data/things.js';
import { randomPlaylistNames } from '../data/playlistNames.js';
import {
  defaultTheme,
  defaultThing,
  defaultCopy,
  defaultTextSize,
  defaultTextAlignment,
} from '../data/defaults.js';

export const THEME_SELECTED = 'THEME_SELECTED';
export const THING_SELECTED = 'THING_SELECTED';
export const COPY_CHANGED = 'COPY_CHANGED';
export const TEXT_SIZE_CHANGED = 'TEXT_SIZE_CHANGED';
export const TEXT_ALIGNMENT_CHANGED = 'TEXT_ALIGNMENT_CHANGED';

// Action creators mirror the shipped bundle: COPY_CHANGED carries the whole copy
// object (both fields), not a delta, so callers must pass the untouched half.
export const themeSelected = (theme) => ({ type: THEME_SELECTED, payload: theme });
export const thingSelected = (thing) => ({ type: THING_SELECTED, payload: thing });
export const copyChanged = (copy) => ({ type: COPY_CHANGED, payload: copy });
export const textSizeChanged = (size) => ({ type: TEXT_SIZE_CHANGED, payload: size });
export const textAlignmentChanged = (alignment) => ({ type: TEXT_ALIGNMENT_CHANGED, payload: alignment });

export const initialState = {
  themes,
  things,
  randomPlaylistNames,
  activeTheme: defaultTheme,
  activeThing: defaultThing,
  activeCopy: defaultCopy,
  textSize: defaultTextSize,
  textAlignment: defaultTextAlignment,
};
