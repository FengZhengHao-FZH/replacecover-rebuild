import { useSelector, useDispatch } from 'react-redux';
import { themeSelected } from '../store/actions.js';
import { SmallPreviewBox } from './SmallPreviewBox.jsx';

// main.js:1:12565-13010 (`S`). Each theme cell previews itself with the *currently
// active* object painted on top, which is why picking a theme re-renders every cell.
export function ThemesGrid() {
  const themes = useSelector((state) => state.themes);
  const activeTheme = useSelector((state) => state.activeTheme);
  const activeThing = useSelector((state) => state.activeThing);
  const dispatch = useDispatch();

  return (
    <section className="c-smallPreviewBoxGrid">
      {themes.map((theme) => (
        <SmallPreviewBox
          key={theme.id}
          active={activeTheme.id === theme.id}
          onPress={() => dispatch(themeSelected(theme))}
          object={{ ...activeThing }}
          theme={theme}
          containerClass="c-smallPreviewBox"
        />
      ))}
    </section>
  );
}

export default ThemesGrid;
