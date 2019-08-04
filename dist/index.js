'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');

function useOAuth() {
    var openedWindow = react.useRef(null);
    var focus = react.useCallback(function () {
        if (openedWindow.current) {
            openedWindow.current.focus();
        }
    }, [openedWindow]);
    return { focus: focus };
}

exports.useOAuth = useOAuth;
//# sourceMappingURL=index.js.map
