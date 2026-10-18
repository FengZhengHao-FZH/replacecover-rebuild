import { combineReducers, createStore } from 'redux';
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
import {
  THEME_SELECTED,
  THING_SELECTED,
  COPY_CHANGED,
  TEXT_SIZE_CHANGED,
  TEXT_ALIGNMENT_CHANGED,
} from './actions.js';

// Three slices are constant thunks in the shipped bundle - they ignore state and
// action entirely, so they can never change shape. Kept as-is rather than promoted
// to module constants, because `state.themes` is a real read path in the UI.
const themesReducer = () => themes;
const thingsReducer = () => things;
const randomPlaylistNamesReducer = () => randomPlaylistNames;

// The other five each have exactly one case plus a pass-through default; the
// payload replaces the whole object (no merging), matching the original switches.
const activeTheme = (state = defaultTheme, action) => {
  switch (action.type) {
    case THEME_SELECTED:
      return action.payload;
    default:
      return state;
  }
};

const activeThing = (state = defaultThing, action) => {
  switch (action.type) {
    case THING_SELECTED:
      return action.payload;
    default:
      return state;
  }
};

const activeCopy = (state = defaultCopy, action) => {
  switch (action.type) {
    case COPY_CHANGED:
      return action.payload;
    default:
      return state;
  }
};

const textSize = (state = defaultTextSize, action) => {
  switch (action.type) {
    case TEXT_SIZE_CHANGED:
      return action.payload;
    default:
      return state;
  }
};

const textAlignment = (state = defaultTextAlignment, action) => {
  switch (action.type) {
    case TEXT_ALIGNMENT_CHANGED:
      return action.payload;
    default:
      return state;
  }
};

export const rootReducer = combineReducers({
  themes: themesReducer,
  things: thingsReducer,
  activeTheme,
  activeThing,
  activeCopy,
  textSize,
  textAlignment,
  randomPlaylistNames: randomPlaylistNamesReducer,
});

export const store = createStore(rootReducer);
