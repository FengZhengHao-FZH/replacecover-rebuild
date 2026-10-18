import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { store } from './store/index.js';
import { isMobile } from './lib/device.js';
import Home from './components/Home.jsx';
import { AboutPage, ChangelogPage } from './components/Pages.jsx';

// main.js:1:29340-29400 (`te`, `ae`). Uses the deprecated keyCode===9 rather than
// e.key, and detaches after the first Tab so focus styling never re-enables.
function markTabbing(event) {
  if (event.keyCode === 9) {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', markTabbing);
  }
}

function TabAccessibility() {
  useEffect(() => {
    window.addEventListener('keydown', markTabbing);
    return () => window.removeEventListener('keydown', markTabbing);
  }, []);
  return null;
}

// main.js:1:29500-29880 (`ne`).
//
// The shipped tree also rendered a Typekit element here. That kit serves
// canada-type-gibson, an Adobe-licensed family, and use.typekit.net is no longer
// reachable, so this reconstruction drops the element and self-hosts a substitute via
// the @fontsource imports in main.jsx. Ledger obligation B17 carries that as
// unavailable authority rather than pretending the font was reproduced.
export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className={'s-page '.concat(isMobile ? 'touch' : 'no-touch')}>
          <Route exact path="/" render={() => <Home />} />
          <Route exact path="/about" render={() => <AboutPage />} />
          <Route exact path="/changelog" render={() => <ChangelogPage />} />
          <TabAccessibility />
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
