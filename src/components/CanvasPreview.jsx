import { useRef, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { ProgressiveImage } from '../lib/ProgressiveImage.jsx';
import { copyChanged } from '../store/actions.js';
import { isMobile } from '../lib/device.js';

// Maps a text-alignment value to the pill's cross-axis (horizontal) align-self inside
// the flex-column container. `left` has no dedicated .c-canvasPreview--pill.left rule in
// the stylesheet, so it falls back to flex-start; spelling it out here keeps the inline
// value identical to what the editor renders from the class alone.
const PILL_ALIGN_SELF = { left: 'flex-start', center: 'center', right: 'flex-end' };

// main.js:1:9130-11290 (`w`). The raster target is #canvasPreview, so every inline
// style here is what actually lands in the downloaded JPEG.
export function CanvasPreview() {
  const theme = useSelector((state) => state.activeTheme);
  const copy = useSelector((state) => state.activeCopy);
  const thing = useSelector((state) => state.activeThing);
  const textSize = useSelector((state) => state.textSize);
  const textAlignment = useSelector((state) => state.textAlignment);
  const dispatch = useDispatch();
  const src = '/images/objects/'.concat(thing.resourceUrl);
  const placeholder = '/images/objects/placeholders/'.concat(thing.resourceUrl);
  // Mobile renders at half the point size; the shipped expression halves `size`, so
  // 60 becomes "30px".
  const titleFontSize = isMobile
    ? ''.concat(0.5 * textSize.size, 'px')
    : ''.concat(textSize.size, 'px');
  const textareaRef = useRef(null);
  const authorRef = useRef(null);
  const titleEditRef = useRef(null);
  const titleShotRef = useRef(null);

  // The pill is a flex sibling of the two mutually-exclusive title slots (`.c-canvasPreview--title`
  // holds the <textarea> in edit mode; `.c-canvasPreview--title-screenshot` holds the read-only
  // <p> that html2canvas rasterises). `justify-content:space-between` pins the pill relative to the
  // height of whichever slot is visible, so the download drifts vertically whenever the <p>'s natural
  // height diverges from the autosized <textarea>'s height (UA padding + per-line box rounding that
  // compounds on multi-line / large-font / wrapped titles). Mirror the edit slot's measured height
  // onto the export slot so the flex column is byte-identical in both modes and the pill lands in
  // exactly the same place. Re-measured after webfont metrics settle and on viewport resize.
  useLayoutEffect(() => {
    const editSlot = titleEditRef.current;
    const shotSlot = titleShotRef.current;
    if (!editSlot || !shotSlot) return undefined;
    const sync = () => {
      const h = editSlot.offsetHeight;
      // Only trust a real measurement; jsdom / pre-layout report 0.
      if (h) shotSlot.style.height = ''.concat(h, 'px');
    };
    sync();
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(sync).catch(() => {});
    }
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [copy.playlistTitle, textSize.size, textAlignment.alignment]);

  return (
    <div className="c-canvasPreview">
      <div
        className="c-canvasPreviewBox"
        id="canvasPreview"
        style={{
          backgroundColor: theme.backgroundColor,
          backgroundSize: '100%',
          backgroundPosition: 'top left',
        }}
      >
        <ProgressiveImage src={src} placeholder={placeholder}>
          {(currentSrc, isLoading) => (
            <img
              // `isLoading && "loading"` stringifies to "false" when loaded, so the
              // shipped app really does emit a `false` class here. Captured DOM shows
              // `c-canvasPreviewBox--image false`; preserved rather than tidied.
              className={'c-canvasPreviewBox--image '.concat(isLoading && 'loading')}
              src={currentSrc}
              alt=""
            />
          )}
        </ProgressiveImage>
        <div className="c-canvasPreviewBox--container">
          <input
            value={copy.playlistAuthor}
            onChange={(event) =>
              dispatch(
                copyChanged({
                  playlistAuthor: event.target.value,
                  playlistTitle: copy.playlistTitle,
                }),
              )
            }
            ref={authorRef}
            className="c-canvasPreview--author textareaReset"
            style={{
              color: theme.contrastColor,
              // Dead lookup in the shipped bundle: `activeCopy` only ever carries
              // playlistAuthor / playlistTitle, so this is undefined and React emits
              // no font-size - the author size comes from the stylesheet.
              fontSize: copy.playlistAuthorFontSize,
              textAlign: textAlignment.alignment,
              // normalize.css pins every <input> to `line-height:1.15` (a ~23px box at
              // this 20px size) and `.textareaReset` adds `overflow:auto`, so the font's
              // descenders (g/y/p/...) get clipped - and html2canvas rasterises this same
              // <input> on download, so the JPEG inherits the cut-off bottom. Overriding
              // to `normal` lets the line box grow to the font's real metrics; this is
              // font-agnostic and cannot be done in original.css (byte-fidelity constraint).
              lineHeight: 'normal',
            }}
            spellCheck="false"
          />
          <div className="c-canvasPreview--title" ref={titleEditRef}>
            <TextareaAutosize
              autoFocus
              cacheMeasurements
              value={copy.playlistTitle}
              onChange={(event) =>
                dispatch(
                  copyChanged({
                    playlistAuthor: copy.playlistAuthor,
                    playlistTitle: event.target.value,
                  }),
                )
              }
              ref={textareaRef}
              className="c-canvasPreview--textarea textareaReset"
              style={{
                color: theme.textColor,
                fontSize: titleFontSize,
                textAlign: textAlignment.alignment,
              }}
              spellCheck="false"
              maxRows={10}
              minRows={1}
            />
          </div>
          {/* The download rasterises this read-only node, not the textarea above
              (html2canvas cannot paint a <textarea). During rasterise, body.hide-scrollbar
              swaps the two via the stylesheet, so this node MUST mirror the textarea
              exactly - otherwise the JPEG diverges from the editor. The overrides are
              inlined here rather than left to original.css so they can never be lost to
              stylesheet ordering, and they do not touch `display` (the CSS class swap
              still owns that). */}
          <div className="c-canvasPreview--title-screenshot" ref={titleShotRef} style={{ padding: '16px 0' }}>
            <p
              className="c-canvasPreview--textarea textareaReset"
              style={{
                color: theme.textColor,
                fontSize: titleFontSize,
                textAlign: textAlignment.alignment,
                // 1. pre-wrap keeps the user's newlines: a <p> with the default
                //    `white-space: normal` collapses \\n into spaces, so a multi-line
                //    title landed on one line in the download.
                // 2. overflow:visible stops .textareaReset's `overflow: auto` from
                //    clipping ascenders/descenders under `line-height: 1` (missing letters).
                // 3. break-word soft-wraps long words at the box width, like a textarea.
                //    With newlines intact, `text-align` now applies to every visual line,
                //    so left / centre / right match the editor instead of looking centred.
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                overflow: 'visible',
              }}
            >
              {copy.playlistTitle}
            </p>
          </div>
          <span
            className={'c-canvasPreview--pill '.concat(textAlignment.alignment)}
            style={{
              background: theme.contrastColor,
              // Mirror the .center/.right align-self classes as an inline value so the
              // pill's horizontal position is explicit (and survives html2canvas cloning),
              // keeping left/centre/right identical to the editor preview.
              alignSelf: PILL_ALIGN_SELF[textAlignment.alignment] || 'flex-start',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasPreview;
