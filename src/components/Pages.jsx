import trees from '../data/pageTrees.json';
import { RichNode } from './RichNode.jsx';
import analytics from '../lib/analytics.js';

// The shipped About/Changelog pages (main.js:1:18925 `Z`, 26098 `$`) called the GA
// pageview in the render body and then rendered its return value as a trailing child.
// That child is a `pageviewChild` node in the recovered tree and paints nothing, so the
// only thing to reproduce is where the pageview fires.
export function AboutPage() {
  analytics.pageview('/about');
  return <RichNode node={trees.about} />;
}

export function ChangelogPage() {
  analytics.pageview('/changelog');
  return <RichNode node={trees.changelog} />;
}
