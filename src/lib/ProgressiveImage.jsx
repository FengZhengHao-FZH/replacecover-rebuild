import { useEffect, useState } from 'react';

// Render-prop progressive loader, mirroring the shipped `x.a` class component in
// 2.36094bfe.chunk.js (~offset 60100): it yields (currentSrc, isLoading), so the
// placeholder is what paints while the full image is still being preloaded.
//
// Three details come straight from the shipped class and are observable in the runtime DOM:
//   * the value published after a load is `image.src` - the browser-resolved absolute URL,
//     not the string the component was handed;
//   * changing `src` repaints the placeholder until the new image loads;
//   * a failed load never clears `isLoading` (the shipped onError is an optional callback).
export function ProgressiveImage({ src, placeholder, children }) {
  const [current, setCurrent] = useState(placeholder);
  const [loading, setLoading] = useState(true);

  if (typeof children !== 'function') {
    throw new Error('ProgressiveImage requires a function as its only child');
  }

  useEffect(() => {
    let cancelled = false;
    setCurrent(placeholder);
    setLoading(true);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setCurrent(image.src);
      setLoading(false);
    };
    image.src = src;
    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [src, placeholder]);

  return children(current, loading);
}

export default ProgressiveImage;
