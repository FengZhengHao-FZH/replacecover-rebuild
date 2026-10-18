import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
// Poppins replaces the Adobe-licensed canada-type-gibson (see substitute-font.mjs).
// These @fontsource packages are what actually serve the family - renaming the stack
// without importing the files would silently fall through to the Arial fallback.
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import './styles/original.css';
import App from './App.jsx';
import analytics from './lib/analytics.js';

// main.js:1:29271-29295 ran, at module scope before the first render:
//   react-ga.initialize("UA-116318007-1")
//   react-ga.pageview(window.location.pathname + window.location.search)
// The tracking id belongs to the original owner and Universal Analytics is retired, so
// these call sites are kept but the implementation is inert (lib/analytics.js). Wiring
// a real endpoint is a deliberate, documented gap - ledger obligation B18.
analytics.pageview(window.location.pathname + window.location.search);

const container = document.getElementById('root');
createRoot(container).render(createElement(App));
