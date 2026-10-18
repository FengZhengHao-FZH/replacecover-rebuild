import { useSelector, useDispatch } from 'react-redux';
import { textSizeChanged } from '../store/actions.js';

// main.js:1:14690-15590 (`M`). Step is +/-4 with no clamp, so repeated decreases
// drive the size to zero and then negative; the original does the same.
export function TextSizeTool() {
  const textSize = useSelector((state) => state.textSize);
  const dispatch = useDispatch();
  const apply = (size) => dispatch(textSizeChanged({ size }));

  return (
    <div className="c-tools-section c-tools-TextSize">
      <div
        className="c-tools-section--action"
        onClick={() => apply(textSize.size - 4)}
        onKeyPress={() => apply(textSize.size - 4)}
        tabIndex="0"
        role="button"
        aria-label="Decrease text size"
      >
        <span className="ic ic-size-decrease ic-size-dims" />
      </div>
      <div className="c-tools-section--label">
        <span className="ic ic-size ic-size-dims" />
      </div>
      <div
        className="c-tools-section--action"
        onClick={() => apply(textSize.size + 4)}
        onKeyPress={() => apply(textSize.size + 4)}
        tabIndex="0"
        role="button"
        aria-label="Increase text size"
      >
        <span className="ic ic-size-increase ic-size-increase-dims" />
      </div>
    </div>
  );
}
