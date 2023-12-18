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

// Define the initial state for the OAuth process
const initialState: OAuthState = {
  isLoading: false,
  isCancelled: false,
  isCompleted: false,
  isError: false,
}

type Options = {
  window?: {
    height: number
    width: number
  }
}

// Reducer function to handle state changes based on dispatched actions
const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start':
      // Start the OAuth process by setting isLoading to true
      return { ...initialState, isLoading: true }
    case 'complete':
      // Successfully complete the OAuth process
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    case 'cancel':
      // Cancel the OAuth process
      return { ...state, isCancelled: true, isLoading: false }
    case 'error':
      // An error occurred during the OAuth process
      return { ...state, isError: true, isLoading: false, payload: action.payload }
  }
}

export function useOAuth() {
  const openedWindow = useRef<Window | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  const start = useCallback(
    (providerURL: string, options: Options): Promise<unknown> =>
      new Promise((resolve, reject) => {
        // Dispatching start action before opening the window
        dispatch({ type: 'start' })

        // Opens a new window for the OAuth process
        openedWindow.current = openWindow(
          providerURL,
          'Auth',
          options.window?.width ?? 660,
          options.window?.height ?? 370,
        )

        // If the window couldn't be opened, handle the error
        if (!openedWindow.current) {
          const payload = { message: "Can't open window" }
          dispatch({ type: 'error', payload })
          reject(payload)
        }

        let isDone = false

        // Event listener to handle the message received from the OAuth window
        const messageListener = (event: MessageEvent): void => {
          if (event.data.source !== 'oauth') {
            return
          }

          // Clean up the message event listener
          window.removeEventListener('message', messageListener)
          isDone = true
          dispatch({ type: 'complete' })
          resolve(event.data.payload)
        }

        // Start listening for messages from the OAuth window
        window.addEventListener('message', messageListener)

        // Checks at regular intervals if the OAuth window was closed without completion
        const intervalId = window.setInterval(() => {
          if (openedWindow.current && !openedWindow.current.closed) return
          clearInterval(intervalId)

          if (!isDone) {
            const payload = { message: 'Window closed without completing OAuth' }
            dispatch({ type: 'cancel', payload })
            reject(payload)
          }
        }, 100)
      }),
    [],
  )

  // Function to bring OAuth window to front if it's already opened
  const focus = useCallback(() => {
    if (openedWindow.current && !openedWindow.current.closed) {
      openedWindow.current.focus()
    }
  }, [])

  // Expose the start, focus, and state as part of the custom hook's return value
  return useMemo(() => ({ start, focus, state }), [focus, start, state])
}

