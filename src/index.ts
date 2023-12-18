import { useCallback, useMemo, useReducer, useRef } from 'react'
// Helper function import to open a new window for OAuth flow
import { openWindow } from './helpers'

// State type defining the various states the OAuth process can be in
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

type ActionType = 'start' | 'cancel' | 'complete' | 'error' // Action types for reducer

type Action = {
  // Action structure for reducer
  type: ActionType
  payload?: unknown
}

const initialState: OAuthState = {
  // The initial state before starting the OAuth process
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

type Options = {
  // Options that can be passed to customize the OAuth window
  window?: {
    height: number
    width: number
  }
}

// Reducer function to manage state transitions
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': {
      return { ...initialState, isLoading: true } // Start the loading process
    }
    case 'complete': {
      // Successful completion of OAuth flow
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    }
    case 'cancel': {
      // OAuth flow was cancelled by the user
      return { ...state, isCancelled: true, isLoading: false }
    }
    case 'error': {
      // An error occurred during OAuth flow
      return { ...state, isError: true, isLoading: false, payload: action.payload }
    }
  }
}

// Hook to manage the OAuth flow
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null) // Reference to the opened OAuth window
  const [state, dispatch] = useReducer(reducer, initialState) // Use of reducer to manage state

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Open the OAuth window with specified dimensions or default ones
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // Handle the case where the window cannot be opened
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        let isDone = false // Flag to check if authentication has completed

        // Listener for messages from the opened OAuth window
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Clean-up once a message is received
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }
        
        // Register the message event listener
        window.addEventListener('message', messageListener)

        // Set up an interval to check if the OAuth window has been closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId) // Clear interval if the window is closed

          // If the window is closed and OAuth hasn't finished, it's considered as cancelled
          if (!isDone) {
            const payload = { message: 'Window closed by user' }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100) // Checks every 100ms
      }),
    [],
  )

  // Function to focus on the OAuth window if it's still open
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Memoization to prevent unnecessary renders and re-creation of functions
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}
