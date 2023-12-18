import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// Definition of OAuth state shape.
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// ActionType definition for action types used in reducer.
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Action type definition for reducer actions.
type Action = {
  type: ActionType
  payload?: unknown
}

// Initial state for the OAuth flow.
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Type definition for optional window parameters.
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function to handle OAuth state updates.
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
  }
}

// Custom hook to handle OAuth flow.
export function useOAuth() {
  // Reference to the opened window.
  const openedWindow = useRef<Window | null>(null)
  // State management using useReducer hook.
  const [state, dispatch] = useReducer(reducer, initialState)

  // Start function to initiate the OAuth flow by opening a new window.
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Open a window with the provider's URL and specified width and height.
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // If window opening fails, dispatch error and reject promise.
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        let isDone = false

        // Message event listener to handle OAuth data from the opened window.
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        window.addEventListener('message', messageListener)

        // Interval check whether the opened window was closed.
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          if (!isDone) {
            // If window is closed without completing, dispatch cancel and reject promise.
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Function to focus the opened window.
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // useMemo hook to memoize and return the hook's result.
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}