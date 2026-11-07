import * as React from 'react';

const QUERY = '(hover: hover) and (pointer: fine)';

/**
 * Whether the primary pointer can hover (mouse/trackpad). Touch devices
 * (phones, tablets) cannot; CSS/JS tooltips that rely on hover flash and
 * dismiss instantly there, so components should render static alternatives.
 */
export function useCanHover() {
  const [canHover, setCanHover] = React.useState(true);

  React.useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setCanHover(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return canHover;
}
