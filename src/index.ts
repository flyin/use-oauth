import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { openWindow } from './helpers';

interface State {
    isCancelled: boolean;
    isFatal: boolean;
    isLoading: boolean;
    isLoaded: boolean;
    isSuccessful: boolean;
    provider: string;
    message?: string;
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
    isFatal: false,
    isLoading: false,
    isLoaded: false,
    isSuccessful: false,
    provider: '',
    message: '',
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
        provider: provider,
    };
}

function cancel(provider: string): State {
    return {
        ...initialState,
        isFatal: true,
        isLoading: false,
        isLoaded: false,
        isCancelled: true,
        provider: provider,
    };
}

function error(provider: string, message: string): State {
    return {
        ...initialState,
        message: message,
        provider: provider,
        isLoading: false,
        isLoaded: true,
        isFatal: true,
    };
}

export function useOAuth({ onSuccess, providerURL }: HookParams): Hook {
    const openedWindow: MutableRefObject<Window | null> = useRef(null);
    const [state, setState] = useState(initialState);

    // check window state
    useEffect(() => {
        let interval: number;

        if (state.isLoading) {
            interval = window.setInterval(() => {
                if (!openedWindow.current || !openedWindow.current.closed) return;

                clearInterval(interval);

                if (state.isLoading) {
                    setState(cancel(state.provider));
                }
            }, 150);
        }

        return (): void => clearInterval(interval);
    }, [state.isLoading, state.provider]);

    const auth = useCallback((provider: string): void => {
        setState(start(provider));
        openedWindow.current = openWindow(getProviderURL(providerURL, provider), 'Auth', 660, 370);

        if (!openedWindow.current) {
            setState(error(provider, "Can't open window"));
        }
    }, []);

    const focus = useCallback(() => {
        if (openedWindow.current) {
            openedWindow.current.focus();
        }
    }, [openedWindow]);

    const windowMessageListener = useCallback(
        event => {
            if (event.data.source !== 'auth') {
                return;
            }

            const nextState = { ...state, ...event.data };
            setState(nextState);

            if (typeof onSuccess === 'function') {
                onSuccess(nextState);
            }
        },
        [state],
    );

    useEffect(() => {
        window.addEventListener('message', windowMessageListener);
        return (): void => window.removeEventListener('message', windowMessageListener);
    }, [windowMessageListener]);

    return { auth, focus, state };
}
