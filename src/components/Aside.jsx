import { useSelector } from 'react-redux';
import logoMarkup from '../assets/logo.svg?raw';
import { ShuffleTool } from './ShuffleTool.jsx';
import { TextSizeTool } from './TextSizeTool.jsx';
import { TextAlignmentTool } from './TextAlignmentTool.jsx';
import { DownloadTool } from './DownloadTool.jsx';

// The shipped aside used a ReactSVG fetch-and-inline component (`z.default` pointed at
// ./svg/logo.svg). Inlining the same file at build time keeps the DOM identical - the
// captured tree is svg > g > 4 rects + g > 2 paths - without a runtime request.
function AsideLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 124 32"
      dangerouslySetInnerHTML={{ __html: innerOf(logoMarkup) }}
    />
  );
}

function innerOf(svg) {
  const open = svg.indexOf('>');
  const close = svg.lastIndexOf('</svg>');
  return svg.slice(open + 1, close);
}

function CanvasEditor() {
  return (
    <div className="c-canvasEditor">
      <ShuffleTool />
      <TextSizeTool />
      <TextAlignmentTool />
      <DownloadTool />
    </div>
  );
}

// main.js:1:18015-18930 (`X`). The h1 colour tracks the active theme, which is why the
// aside repaints on every theme change.
export function Aside() {
  const theme = useSelector((state) => state.activeTheme);

  return (
    <div className="s-aside">
      <div className="c-aside-container">
        <a className="c-aside-logo" href="/" title="Replace Your Spotify Cover Art">
          <AsideLogo />
        </a>
        <div className="c-aside-content">
          <h1 style={{ color: theme.backgroundColor }}>
            {'Create cool album art '}
            <br />
            {'for your Spotify playlists'}
          </h1>
        </div>
        <div className="c-aside-actions">
          <a href="/about" title="About this thing" className="inline-block">
            <span role="img" aria-label="finger">{'\u{1F449}'}</span> About &amp; Roadmap
          </a>
          <br />
          <a href="/changelog" title="What's new" className="inline-block mt-2">
            <span role="img" aria-label="finger">{'\u{1F449}'}</span> Changelog
          </a>
        </div>
        <CanvasEditor />
      </div>
    </div>
  );
}

export default Aside;
