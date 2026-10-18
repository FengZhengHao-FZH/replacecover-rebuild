import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { ProgressiveImage } from '../lib/ProgressiveImage.jsx';
import { copyChanged } from '../store/actions.js';
import { isMobile } from '../lib/device.js';

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
            }}
            spellCheck="false"
          />
          <div className="c-canvasPreview--title">
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
          <div className="c-canvasPreview--title-screenshot">
            <p
              className="c-canvasPreview--textarea textareaReset"
              style={{
                color: theme.textColor,
                fontSize: titleFontSize,
                textAlign: textAlignment.alignment,
              }}
            >
              {copy.playlistTitle}
            </p>
          </div>
          <span
            className={'c-canvasPreview--pill '.concat(textAlignment.alignment)}
            style={{ background: theme.contrastColor }}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasPreview;
