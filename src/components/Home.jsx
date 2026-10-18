import { CanvasPreview } from './CanvasPreview.jsx';
import { Editor } from './Editor.jsx';
import { Aside } from './Aside.jsx';

// main.js:1:11170-11240 (`F`). The container class is spelled `s-convasContainer` in the
// shipped CSS and markup - a typo in the original, kept because the stylesheet uses it.
function Canvas() {
  return (
    <div className="s-canvas">
      <div className="s-convasContainer">
        <CanvasPreview />
      </div>
    </div>
  );
}

// main.js:1:19090-19150 (`V`).
export function HomePage() {
  return (
    <div className="v-home">
      <Editor />
      <Canvas />
      <Aside />
    </div>
  );
}

export default HomePage;
