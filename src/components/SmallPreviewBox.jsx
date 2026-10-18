import { LazyLoadComponent } from '../lib/LazyLoadComponent.jsx';
import { ProgressiveImage } from '../lib/ProgressiveImage.jsx';

// main.js:1:11308-12560 (`U`). One component serves both grids; `containerClass`
// selects the theme or thing skin, and the image class is derived from it.
export function SmallPreviewBox({
  onPress = () => {},
  theme = {},
  object = {},
  active = false,
  containerClass = '',
}) {
  const contrastColor = theme.contrastColor;
  const textColor = theme.textColor;
  const backgroundColor = theme.backgroundColor;
  const resourceUrl = object.resourceUrl;
  const thingName = object.thingName;
  const src = '/images/objects/'.concat(resourceUrl);
  const placeholder = '/images/objects/placeholders/'.concat(resourceUrl);

  return (
    <div
      className={''.concat(containerClass, ' ').concat(active ? 'active' : '')}
      style={{ background: backgroundColor }}
      onClick={onPress}
      onKeyPress={onPress}
      tabIndex="0"
      role="button"
      aria-label="Select theme or thing"
    >
      <span className="c-smallPreviewBox--contrast c-smallPreviewBox--contrastLine1" style={{ background: contrastColor }} />
      <span className="c-smallPreviewBox--contrast c-smallPreviewBox--contrastLine2" style={{ background: contrastColor }} />
      <LazyLoadComponent>
        <ProgressiveImage src={src} placeholder={placeholder}>
          {(currentSrc, isLoading) => (
            <img
              className={''
                .concat(containerClass, '--image ')
                .concat(isLoading ? 'loading' : '')}
              src={currentSrc}
              alt={thingName}
            />
          )}
        </ProgressiveImage>
      </LazyLoadComponent>
      <span className="c-smallPreviewBox--text c-smallPreviewBox--textLine1" style={{ background: textColor }} />
      <span className="c-smallPreviewBox--text c-smallPreviewBox--textLine2" style={{ background: textColor }} />
    </div>
  );
}

export default SmallPreviewBox;
