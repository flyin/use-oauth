import { useCallback, useMemo, useReducer, useRef } from 'react';
import { openWindow } from './helpers';

export type OAuthState = {
  isLoading: boolean;
  isCancelled: boolean;
  isCompleted: boolean;
  isError: boolean;
  payload?: unknown;
};

type ActionType = 'start' | 'cancel' | 'complete' | 'error';

type Action = {
  type: ActionType;
  payload?: unknown;
};

const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
};

type Options = {
  window?: {
    height: number;
    width: number;
  };
};

const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': {
      return { ...initialState, isLoading: true };
    }
    case 'complete': {
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload };
    }
    case 'cancel': {
      return { ...state, isCancelled: true, isLoading: false };
    }
    case 'error': {
      return { ...state, isError: true, isLoading: false, payload: action.payload };
    }
  }
  return state;
};

export function useOAuth() {
  const openedWindow = useRef<Window | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' });

        openedWindow.current = openWindow(
          providerURL,
          'Auth',

          options.window?.width ?? 660,
          options.window?.height ?? 370,
        );

        if (!openedWindow.current) {
          const payload = { message: "Can't open window" };
          dispatch({ type: 'error', payload });
          return reject(payload);
        }

        let isDone = false;

        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return;
          }

          window.removeEventListener('message', messageListener);
          isDone = true;
          dispatch({ type: 'complete' });
          resolve(event.data.payload);
        };

        window.addEventListener('message', messageListener);

        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return;
          clearInterval(intervalId);

          if (!isDone) {
            const payload = { message: "Can't open window" };
            dispatch({ type: 'cancel', payload });
            reject(payload);
          }
        }, 100);
      }),
    [],
  );

  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus();
    }
  }, []);

  return useMemo(() => ({ start, focus, state }), [focus, start, state]);
}
