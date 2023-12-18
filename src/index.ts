import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// Define the types for the authentication state
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// Define action types for the state reducer
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Define action structure
type Action = {
  type: ActionType
  payload?: unknown
}

// Initial state of the authentication process
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Define reducer function to update state based on actions
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': {
      // Start the OAuth process (loading state)
      return { ...initialState, isLoading: true }
    }
    case 'complete': {
      // Complete the OAuth process with provided payload
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    }
    case 'cancel': {
      // Cancel the OAuth process
      return { ...state, isCancelled: true, isLoading: false }
    }
    case 'error': {
      // Mark the process as error with information
      return { ...state, isError: true, isLoading: false, payload: action.payload }
    }
  }
}

// Hook for handling OAuth Logic
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null) // Reference to the opened window
  const [state, dispatch] = useReducer(reducer, initialState) // State and dispatcher for OAuth state

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Open a new window for OAuth authentication
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          reject(payload)
        }

        let isDone = false // Flag to check completion

        // Event listener for receiving messages from the opened window
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Unsubscribe the listener once OAuth data is received
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Subscribe to message events
        window.addEventListener('message', messageListener)

        // Polling to check if the window has been closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          // If window is closed without completing OAuth, cancel the process
          if (!isDone) {
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Function to focus the OAuth window if it is open
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Memoize to only recompute if one of the dependencies has changed
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}
