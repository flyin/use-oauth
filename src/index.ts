// Custom Hook for OAuth authentication

import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// OAuth state type definition
export type OAuthState = {
  isLoading: boolean
  isCancelled: boolean
  isCompleted: boolean
  isError: boolean
  payload?: unknown
}

// Action types for state management
type ActionType = 'start' | 'cancel' | 'complete' | 'error'

// Define action structure
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

// Optional parameters for OAuth window
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer for state management inside the hook
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

// The custom hook that can be used for OAuth processes
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  // Start function initializes the OAuth flow
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Open the authentication window
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // Handle case when window can't be opened
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        // Set up a message listener to handle incoming data
        let isDone = false

        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Clean up and dispatch complete action
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        window.addEventListener('message', messageListener)

        // Periodically check if the window is closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          // Dispatch cancel action if process is not completed and window closed
          if (!isDone) {
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Focus on the OAuth window if it's open and not closed
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}