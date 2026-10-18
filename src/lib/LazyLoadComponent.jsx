import { useEffect, useRef, useState } from 'react';

// The shipped grid wrapped every cell image in `T.LazyLoadComponent` (react-lazyload).
// Two captures of the original fix both of its observable states:
//   * unrevealed  -> <span class="" style="display: inline-block;"></span> (ev_ae8fb5b3)
//   * revealed    -> the children sit directly in the cell, wrapper gone (ev_6508139e:
//                    51 empty wrappers and 11 images for 61 cells)
// Reimplemented on IntersectionObserver because react-lazyload relies on findDOMNode,
// which React 18 removes; the mount-when-visible contract is unchanged.
export function LazyLoadComponent({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (visible) return <>{children}</>;
  return <span ref={ref} className="" style={{ display: 'inline-block' }} />;
}

export default LazyLoadComponent;
