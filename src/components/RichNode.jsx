import ChangelogEntry from './ChangelogEntry.jsx';

// Renders a createElement tree recovered from the shipped bundle (produced by
// replacecover/emit-page-trees.js). Keeping this copy as data instead of retyping it
// into JSX is what guarantees the About and Changelog wording matches the original.
const ALLOWED_TAGS = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'ul', 'li', 'a', 'span', 'br', 'strong', 'em', 'small', 'code',
]);

// `aria-label` is the one hyphenated key the bundle quotes, and the recovered trees carry it
// on every role="img" emoji span, so it has to pass through for screen readers to work.
const ALLOWED_PROPS = ['className', 'href', 'title', 'alt', 'rel', 'target', 'role', 'aria-label'];

export function RichNode({ node }) {
  if (typeof node === 'string') return node;
  if (!node) return null;
  // The shipped About/Changelog pages render react-ga's pageview() return value as a
  // JSX child. It is undefined, so it paints nothing; the pageview itself is issued by
  // the page component, which is where the observable effect actually lives.
  if (node.type === 'pageviewChild') return null;

  const children = (node.children || []).map((child, i) =>
    (typeof child === 'string' ? child : <RichNode key={i} node={child} />));

  if (node.type === 'ChangelogEntry') {
    return (
      <ChangelogEntry date={node.props.date} title={node.props.title}>
        {children}
      </ChangelogEntry>
    );
  }

  if (!ALLOWED_TAGS.has(node.type)) {
    // An unknown type means the recovered tree holds a node this renderer was not
    // taught about; failing loudly beats silently rendering the wrong tag.
    throw new Error('RichNode: unhandled node type "'.concat(String(node.type), '"'));
  }

  const props = {};
  for (const name of ALLOWED_PROPS) {
    if (node.props[name] !== undefined) props[name] = node.props[name];
  }
  const Tag = node.type;
  // React rejects `children` on void tags even when the list is empty, and the recovered
  // tree carries <br/> as {children: []}.
  if (children.length === 0) return <Tag {...props} />;
  return <Tag {...props}>{children}</Tag>;
}

export default RichNode;
