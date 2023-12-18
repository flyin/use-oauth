// Import necessary hooks from React
import { useCallback, useMemo, useReducer, useRef } from 'react'
// Import the helper function to open a window
import { openWindow } from './helpers'

// Define the shape of the state in our OAuth process
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// Define the types of actions we can dispatch
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Define the action object type
type Action = {
  type: ActionType
  payload?: unknown
}

// Initialize the default state for the OAuth process
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Define options for configuring the OAuth window
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function to handle state transitions based on dispatched actions
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

// Custom hook to handle the OAuth process
export function useOAuth() {
  // Track the OAuth window object
  const openedWindow = useRef<Window | null>(null)
  // Use the useReducer hook to get state and dispatch function
  const [state, dispatch] = useReducer(reducer, initialState)

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        // Dispatch an action to indicate the start of the process
        dispatch({ type: 'start' })

        // Open a new window for OAuth
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          
          // Fallback to default window dimensions if not provided
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // Reject the promise if the window couldn't be opened
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        // Variable to determine if the OAuth flow has completed
        let isDone = false

        // Event listener for receiving messages from the opened window
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Clean up the event listener and dispatch completion action
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Register the event listener
        window.addEventListener('message', messageListener)

        // Poll to check if the OAuth window was closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          // If the window was closed and OAuth flow is incomplete, dispatch cancel action
          if (!isDone) {
            const payload = { message: "Window has been closed by the user" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Function to focus the OAuth window
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Memoize the functions and state to avoid unnecessary re-renders
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}