import { useCallback, useMemo, useReducer, useRef } from 'react';
import { openWindow } from './helpers';

// Define the initial state types
export type OAuthState = {
  isLoading: boolean; // Indicates if the OAuth process is loading
  isCancelled: boolean; // Indicates if the OAuth process has been cancelled
  isCompleted: boolean; // Indicates if the OAuth process has completed
  isError: boolean; // Indicates if there was an error during the OAuth process
  payload?: unknown; // The payload returned by the OAuth process
};

// Define ActionTypes as a union of literals representing actions
type ActionType = 'start' | 'cancel' | 'complete' | 'error';

type Action = {
  type: ActionType;
  payload?: unknown;
};

// Define the initial state for the reducer
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
};

// Define options for the window parameters
type Options = {
  window?: {
    height: number;
    width: number;
  };
};

// OAuth reducer function to update state based on actions
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': { // Start the loading process
      return { ...initialState, isLoading: true };
    }
    case 'complete': { // Complete the process
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload };
    }
    case 'cancel': { // Cancel the process
      return { ...state, isCancelled: true, isLoading: false };
    }
    case 'error': { // Handle an error in the process
      return { ...state, isError: true, isLoading: false, payload: action.payload };
    }
  }
};

// Custom hook for handling OAuth authentication flow
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' });

        // Open a window for OAuth authentication
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        );

        // Handle error if the window fails to open
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" };
          dispatch({ type: 'error', payload });
          return reject(payload);
        }

        // Set up a listener for messages from the OAuth window
        let isDone = false;
        const messageListener = (event: MessageEvent): void => {
          // Only handle messages specifically intended for OAuth
          if (event.data.source !== 'oauth') {
            return;
          }

          // Clean up the message listener and update state
          window.removeEventListener('message', messageListener);
          isDone = true;
          dispatch({ type: 'complete' });
          resolve(event.data.payload);
        };
        window.addEventListener('message', messageListener);

        // Poll to check if the window has been manually closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return;
          clearInterval(intervalId);

          // If the window was closed without a proper OAuth completion, handle it as cancellation
          if (!isDone) {
            const payload = { message: "Window was manually closed" };
            dispatch({ type: 'cancel', payload });
            reject(payload);
          }
        }, 100);
      }),
    [],
  );

  // Focus on the OAuth window if it's not closed
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus();
    }
  }, []);

  // Memoize the start, focus, and state functions to prevent unnecessary re-renders
  return useMemo(() => ({ start, focus, state }), [focus, start, state]);
}
