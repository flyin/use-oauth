// Importing React hooks
import { useCallback, useMemo, useReducer, useRef } from 'react';
// Importing openWindow helper function
import { openWindow } from './helpers';

// Defining OAuth state interface
export type OAuthState = {
  isLoading: boolean;
  isCancelled: boolean;
  isCompleted: boolean;
  isError: boolean;
  payload?: unknown;
};

// Defining the action types for useOAuth reducer
type ActionType = 'start' | 'cancel' | 'complete' | 'error';

// Defining the action interface
type Action = {
  type: ActionType;
  payload?: unknown;
};

// Initial state for the OAuth process
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
};

// Defining additional window options interface
type Options = {
  window?: {
    height: number;
    width: number;
  };
};

// Reducer function to manage the OAuth state
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
};

// Custom hook to handle OAuth flow
export function useOAuth() {
  // Reference to store the opened window
  const openedWindow = useRef<Window | null>(null);
  // Reducer to manage the OAuth state
  const [state, dispatch] = useReducer(reducer, initialState);

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' });

        // Open a new window for authentication
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        );

        // Reject promise if window couldn't be opened
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" };
          dispatch({ type: 'error', payload });
          return reject(payload);
        }

        // Listener and interval for handling the authentication response
        let isDone = false;
        const messageListener = (event: MessageEvent): void => {
          // Process messages from OAuth source only
          if (event.data.source !== 'oauth') {
            return;
          }

          // Cleanup and handle response
          window.removeEventListener('message', messageListener);
          isDone = true;
          dispatch({ type: 'complete' });
          resolve(event.data.payload);
        };

        window.addEventListener('message', messageListener);

        // Setup interval to check if the window was closed without completing the auth
        const intervalId = window.setInterval(() => {
          // Do nothing if window is still open
          if (openedWindow.current && !openedWindow.current.closed) return;
          // Clear interval and dispatch cancel action if process is incomplete
          clearInterval(intervalId);
          if (!isDone) {
            const payload = { message: "Window closed without completing authentication" };
            dispatch({ type: 'cancel', payload });
            reject(payload);
          }
        }, 100);
      }),
    [],
  );

  // Function to focus the OAuth window if it exists and it's not closed
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus();
    }
  }, []);

  // Memoizing the return value to avoid unnecessary re-renders
  return useMemo(() => ({ start, focus, state }), [focus, start, state]);
}