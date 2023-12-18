import { useCallback, useMemo, useReducer, useRef } from 'react'
import { openWindow } from './helpers'

// State type definition for OAuth
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

// Initial state for the OAuth process
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

// Options type definition for the OAuth window customization
type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function to handle state changes based on dispatched actions
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start': // OAuth process started
      return { ...initialState, isLoading: true }
    case 'complete': // OAuth process completed successfully
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    case 'cancel': // OAuth process was cancelled
      return { ...state, isCancelled: true, isLoading: false }
    case 'error': // An error occurred during OAuth process
      return { ...state, isError: true, isLoading: false, payload: action.payload }
  }
}

// Custom hook for implementing OAuth logic
export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  // Function to start the OAuth process
  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        dispatch({ type: 'start' })

        // Attempt to open a new window for OAuth authentication
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660, // Default window width
          options.window?.height ?? 370, // Default window height
        )

        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          return reject(payload)
        }

        let isDone = false

        // Event listener to handle messages (data) from the opened window
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

        // Polling to check if the opened window is closed
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          if (!isDone) {
            const payload = { message: "Can't open window" }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100) // Poll every 100ms
      }),
    [],
  )

  // Function to focus on the opened OAuth window
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Memoize values to avoid unnecessary renders
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}
