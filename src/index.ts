import { useCallback, useMemo, useReducer, useRef } from 'react'
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

// Define the initial OAuth state
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Define possible OAuth dialog window dimensions
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function to handle OAuth state transitions
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

// The `useOAuth` hook encapsulates the OAuth logic
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  // `start` handles opening the OAuth window and sets up message listener and interval check
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Attempt to open the window for OAuth
        openedWindow.current = openWindow(providerURL, 'Auth', options.window?.width ?? 660, options.window?.height ?? 370)

        // If window fails to open, immediately return error
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        // Flag to indicate completion
        let isDone = false

        // Listen for messages from the OAuth window
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Clean up listener once message received
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Attach event listener for receiving messages
        window.addEventListener('message', messageListener)

        // Poll to check if the OAuth window was closed without sending a message
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          // If window closed and no message received, it's considered canceled
          if (!isDone) {
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // `focus` allows re-focusing on the OAuth window if it's open and not closed
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Return memoized object containing the `start`, `focus` methods, and the current `state`
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}
