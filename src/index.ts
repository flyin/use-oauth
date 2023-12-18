import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

type ActionType = 'start' | 'cancel' | 'complete' | 'error'

type Action = {
  type: ActionType
  payload?: unknown
}

const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

type Options = {
  window?: {
    height: number
    width: number
  }
}

const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': {
      return { ...initialState, isLoading: true }
    }
    case 'complete': {
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    }
    case 'cancel': {
      return { ...state, isCancelled: true, isLoading: false }
    }
    case 'error': {
      return { ...state, isError: true, isLoading: false, payload: action.payload }
    }
    default: {
      // It's important to handle the default case where the action
      // does not match any of the existing action types
      return state;
    }
  }
}

export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  const start = useCallback((providerURL: string, options: Options = {}): Promise<unknown> => {
    dispatch({ type: 'start' });

    const width = options.window?.width ?? 660;
    const height = options.window?.height ?? 370;

    openedWindow.current = openWindow(
      providerURL,
      'Auth',
      width,
      height,
    );

    if (!openedWindow.current) {
      const payload = { message: "Can't open window" };
      dispatch({ type: 'error', payload });
      return Promise.reject(payload);
    }

    const messageListener = (event: MessageEvent): void => {
      if (event.origin !== new URL(providerURL).origin || event.data.source !== 'oauth') {
        // Payload must be from the same origin and have 'oauth' source
        return;
      }

      window.removeEventListener('message', messageListener);
      dispatch({ type: 'complete', payload: event.data.payload });
    };

    window.addEventListener('message', messageListener);

    return new Promise((resolve, reject) => {
      const intervalId = window.setInterval(() => {
        if (openedWindow.current && !openedWindow.current.closed) return;
        clearInterval(intervalId);
        window.removeEventListener('message', messageListener);

        if (state.isCompleted) {
          resolve(state.payload);
        } else {
          const payload = { message: 'The authentication window was closed before completion.' };
          dispatch({ type: 'cancel', payload });
          reject(payload);
        }
      }, 100);
    });
  }, []);

  useEffect(() => {
    // Clean up the message listener when the component using this hook gets unmounted
    return () => {
      if (openedWindow.current) {
        window.removeEventListener('message', messageListener);
      }
    };
  }, []);

  const focus = useCallback(() => {
    openedWindow.current?.focus();
  }, []);

  return useMemo(() => ({ start, focus, state }), [focus, start, state]);
}

