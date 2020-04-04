import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { openWindow } from './helpers';

interface State {
  isCancelled: boolean;
  isError: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  provider?: string;
  message?: string;
  payload?: string;
}

interface Hook {
  auth: (provider: string) => void;
  focus: () => void;
  state: State;
}

type ProviderURL = ((provider: string) => string) | string;

interface HookParams {
  onSuccess?: (state: State) => void;
  providerURL: ProviderURL;
}

const initialState: State = {
  isCancelled: false,
  isError: false,
  isLoading: false,
  isLoaded: false,
};

function getProviderURL(providerURL: ProviderURL, provider: string): string {
  if (typeof providerURL === 'function') {
    return providerURL(provider);
  }

  const newURL = providerURL.replace(/\/$/, '');
  return `${newURL}/${provider}/`;
}

function start(provider: string): State {
  return {
    ...initialState,
    isLoading: true,
    provider: provider,
  };
}

function cancel(): State {
  return {
    ...initialState,
    isCancelled: true,
  };
}

function error(message: string): State {
  return {
    ...initialState,
    message: message,
    isLoaded: true,
    isError: true,
  };
}

export function useOAuth({ onSuccess, providerURL }: HookParams): Hook {
  const openedWindow = useRef<Window | null>(null);
  const [state, setState] = useState(initialState);

  // check window state
  useEffect(() => {
    let interval: number;

    if (state.isLoading) {
      interval = window.setInterval(() => {
        if (!openedWindow.current || !openedWindow.current.closed) return;

        clearInterval(interval);

        if (state.isLoading) {
          setState(cancel());
        }
      }, 150);
    }

    return (): void => clearInterval(interval);
  }, [state.isLoading, state.provider]);

  const auth = useCallback(
    (provider: string): void => {
      setState(start(provider));
      openedWindow.current = openWindow(getProviderURL(providerURL, provider), 'Auth', 660, 370);

      if (!openedWindow.current) {
        setState(error("Can't open window"));
      }
    },
    [providerURL],
  );

  const focus = useCallback(() => {
    if (openedWindow.current) {
      openedWindow.current.focus();
    }
  }, [openedWindow]);

  const windowMessageListener = useCallback(
    (event) => {
      if (event.data.source !== 'auth') {
        return;
      }

      setState((prevState) => {
        const nextState = { ...prevState, payload: event.data.payload };

        if (typeof onSuccess === 'function') {
          setTimeout(() => onSuccess(nextState));
        }

        return nextState;
      });
    },
    [onSuccess],
  );

  useEffect(() => {
    window.addEventListener('message', windowMessageListener);
    return (): void => window.removeEventListener('message', windowMessageListener);
  }, [windowMessageListener]);

  return useMemo(() => ({ auth, focus, state }), [auth, focus, state]);
}
