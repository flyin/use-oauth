import { MutableRefObject, useCallback, useRef } from 'react';

interface Hook {
    focus: () => void;
}

export function useOAuth(): Hook {
    const openedWindow: MutableRefObject<Window | null> = useRef(null);

    const focus = useCallback((): void => {
        if (openedWindow.current) {
            openedWindow.current.focus();
        }
    }, [openedWindow]);

    return { focus };
}
