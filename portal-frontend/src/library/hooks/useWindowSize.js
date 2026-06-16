import React from 'react';

const useWindowSize = () => {
  const isClient = typeof window === 'object';

  const getSize = React.useCallback(
    () => ({
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined,
    }),
    [isClient]
  );

  const [size, setSize] = React.useState(getSize);

  React.useEffect(() => {
    if (!isClient) {
      return false;
    }

    let debounceTimer;
    const onHandleResize = () => {
      clearTimeout(debounceTimer);
      // 150ms debounce: pencere boyutu değişiminde Redux dispatch'i yavaşlatır,
      // böylece ResizeObserver döngü bildirimlerinin tetiklenmesi önlenir.
      debounceTimer = setTimeout(() => {
        setSize(getSize());
      }, 150);
    };

    window.addEventListener('resize', onHandleResize);
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('resize', onHandleResize);
    };
  }, [getSize, isClient]);

  return size;
};

export default useWindowSize;
