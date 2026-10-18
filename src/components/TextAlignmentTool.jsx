import { useSelector, useDispatch } from 'react-redux';
import { textAlignmentChanged } from '../store/actions.js';

const ALIGNMENTS = ['left', 'center', 'right'];

// main.js:1:15900-16150 (`_` and `H`).
export function TextAlignmentTool() {
  const textAlignment = useSelector((state) => state.textAlignment);
  const dispatch = useDispatch();

  return (
    <div className="c-tools-section c-tools-TextAlignment">
      {ALIGNMENTS.map((direction) => (
        <AlignmentButton
          key={'button-'.concat(direction)}
          direction={direction}
          active={textAlignment.alignment === direction}
          onPress={() => dispatch(textAlignmentChanged({ alignment: direction }))}
        />
      ))}
    </div>
  );
}

function AlignmentButton({ direction = 'left', active = false, onPress = () => {} }) {
  return (
    <div
      className={'c-tools-section--action '.concat(active ? 'active' : '')}
      onClick={onPress}
      role="button"
      tabIndex="0"
      onKeyPress={onPress}
      aria-label={'Align text to '.concat(direction)}
    >
      <span className={'ic ic-align-'.concat(direction, ' ic-align-').concat(direction, '-dims')} />
    </div>
  );
}
