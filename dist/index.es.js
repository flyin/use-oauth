import { useRef, useCallback } from 'react';

function useOAuth() {
    var openedWindow = useRef(null);
    var focus = useCallback(function () {
        if (openedWindow.current) {
            openedWindow.current.focus();
        }
    }, [openedWindow]);
    return { focus: focus };
}

export { useOAuth };
//# sourceMappingURL=index.es.js.map
