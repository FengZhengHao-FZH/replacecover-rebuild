import { useSelector, useDispatch } from 'react-redux';
import { thingSelected } from '../store/actions.js';
import { SmallPreviewBox } from './SmallPreviewBox.jsx';

// main.js:1:13015-13500 (`P`). Keyed on the stored `id`, which is not contiguous:
// the things table has 61 rows spanning ids 1..63 with 46 and 58 absent, so an array
// index would be a different (wrong) key.
export function ThingsGrid() {
  const things = useSelector((state) => state.things);
  const activeTheme = useSelector((state) => state.activeTheme);
  const activeThing = useSelector((state) => state.activeThing);
  const dispatch = useDispatch();

  return (
    <section className="c-smallThingsBoxGrid">
      {things.map((thing) => (
        <SmallPreviewBox
          key={thing.id}
          active={activeThing.id === thing.id}
          onPress={() => dispatch(thingSelected(thing))}
          object={{ ...thing }}
          theme={activeTheme}
          containerClass="c-smallThingsBox"
        />
      ))}
    </section>
  );
}

export default ThingsGrid;
