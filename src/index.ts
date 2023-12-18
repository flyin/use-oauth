import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// Type definition for the state of the OAuth process
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// Action types for the OAuth state reducer
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Action type for dispatching state changes
type Action = {
  type: ActionType
  payload?: unknown
}

// Initial OAuth state
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Options type for specifying additional configurations such as window dimensions
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function for handling OAuth state changes
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': {
      // Update state to indicate loading has started
      return { ...initialState, isLoading: true }
    }
    case 'complete': {
      // Update state to indicate the OAuth flow has completed
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    }
    case 'cancel': {
      // Update state to indicate the OAuth flow has been cancelled
      return { ...state, isCancelled: true, isLoading: false }
    }
    case 'error': {
      // Update state to indicate an error occurred during the OAuth flow
      return { ...state, isError: true, isLoading: false, payload: action.payload }
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// Custom hook for handling OAuth authentication
export function useOAuth() {
  // Reference to store the opened window object
  const openedWindow = useRef<Window | null>(null)
  // State and dispatcher for handling OAuth state
  const [state, dispatch] = useReducer(reducer, initialState)

  // Function to start the OAuth flow
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Open a new window for the OAuth provider's URL
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // If the window fails to open, dispatch an error and reject the promise
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        // Flag to check if the OAuth has completed or not
        let isDone = false

        // Event listener callback for receiving messages from the OAuth provider
        const messageListener = (event: MessageEvent): void => {
          // Ignore messages not related to the OAuth flow
          if (event.data.source !== 'oauth') {
            return
          }

          // Once the message is received, remove the listener, update state, and resolve the promise
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Attach the message event listener to the window
        window.addEventListener('message', messageListener)

        // Check at regular intervals if the OAuth window has been closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          // If the window is closed, clear the interval check
          clearInterval(intervalId)

          // If the OAuth flow has not completed yet, dispatch cancel and reject the promise
          if (!isDone) {
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Function to focus the opened OAuth window
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Return a memoized object containing the state and action functions
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}
