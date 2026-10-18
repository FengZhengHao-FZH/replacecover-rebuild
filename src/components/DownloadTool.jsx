import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import analytics from '../lib/analytics.js';
import { isMobile } from '../lib/device.js';

// main.js:1:16620-17600 (`W`).
export function DownloadTool() {
  const theme = useSelector((state) => state.activeTheme);
  const copy = useSelector((state) => state.activeCopy);
  const playlistTitle = copy.playlistTitle;

  function download() {
    const element = document.querySelector('#canvasPreview');
    const filename = ''.concat(playlistTitle, '.jpeg');
    let scale = 1;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (isMobile) scale = window.devicePixelRatio;
    document.body.classList.add('hide-scrollbar');
    html2canvas(element, { width, height, scale }).then((canvas) => {
      const link = document.createElement('a');
      const url = canvas.toDataURL('image/jpeg', 1).replace('image/jpeg', 'image/octet-stream');
      link.download = filename;
      link.href = url;
      link.click();
      document.body.classList.remove('hide-scrollbar');
    });
    analytics.event({ category: 'Covers', action: 'Downloaded A Cover', label: copy.playlistTitle });
  }

  return (
    <div className="c-tools-section c-tools-Download">
      <div
        className="c-tools-section--action"
        onClick={() => download()}
        onKeyPress={() => download()}
        style={{ background: theme.backgroundColor }}
        tabIndex="0"
        role="button"
        aria-label="Download Cover"
      >
        <span className="ic ic-download ic-download-dims" style={{ color: theme.contrastColor }} />
      </div>
    </div>
  );
}
