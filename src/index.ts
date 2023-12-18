import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// Type definition for OAuth state
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// Type definition for available action types
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Type definition for an action object
type Action = {
  type: ActionType
  payload?: unknown
}

// Initial state for OAuth
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Options type for the OAuth window
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function for the OAuth process
const reducer = (state: OAuthState, action: Action): OAuthState => {
  // Handle actions and return the updated state
  switch (action.type) {
    case 'start': {
      // Start the loading process
      return { ...initialState, isLoading: true }
    }
    case 'complete': {
      // Mark the OAuth process as completed
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    }
    case 'cancel': {
      // Mark the OAuth process as cancelled
      return { ...state, isCancelled: true, isLoading: false }
    }
    case 'error': {
      // Mark the OAuth process as resulted in an error
      return { ...state, isError: true, isLoading: false, payload: action.payload }
    }
  }
}

// Custom hook for OAuth process
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)  // Reference to the opened window
  const [state, dispatch] = useReducer(reducer, initialState)  // OAuth state and dispatcher

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })  // Start the OAuth process

        // Use helper function to open a new window for authentication
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660, // Default window width
          options.window?.height ?? 370, // Default window height
        )

        if (!openedWindow.current) {
          // If window fails to open, dispatch an error and reject the promise
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        let isDone = false

        // Listener for receiving the message from the authentication window
        const messageListener = (event: MessageEvent): void => {
          // Ensure message is from the expected source
          if (event.data.source !== 'oauth') {
            return
          }

          // Cleanup listener and mark as done
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Register listener for the message from the authentication window
        window.addEventListener('message', messageListener)

        // Poll to check if the window has been closed without sending a message
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          if (!isDone) {
            // If window is closed and no message was received, dispatch a cancel and reject the promise
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

  // useMemo to memoize the values and functions to prevent unnecessary renders
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}

