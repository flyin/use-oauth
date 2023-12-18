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

const reducer = (state: OAuthState, action: Action): OAuthState => {
  switch (action.type) {
    case 'start':
      return { ...initialState, isLoading: true }
    case 'complete':
      return { ...state, isCompleted: true, isLoading: false, payload: action.payload }
    case 'cancel':
      return { ...initialState, isCancelled: true }
    case 'error':
      return { ...initialState, isError: true, payload: action.payload }
    default:
      return state; // Added a default case to handle any action types that are not expected
  }
}

export function useOAuth() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const openedWindowRef = useRef<Window | null>(null)

  const start = useCallback((providerURL: string, options: Options = {}) => {
    dispatch({ type: 'start' })
    const width = options.window?.width ?? 660
    const height = options.window?.height ?? 370
    
    const newWindow = openWindow(providerURL, 'Auth', width, height)
    if (!newWindow) {
      const payload = { message: "Can't open window" }
      dispatch({ type: 'error', payload })
      return Promise.reject(payload)
    }

    openedWindowRef.current = newWindow
    let isDone = false

    return new Promise<unknown>((resolve, reject) => {
      const messageListener = (event: MessageEvent): void => {
        if (event.origin !== new URL(providerURL).origin || event.data.source !== 'oauth') {
          return
        }

        window.removeEventListener('message', messageListener)
        clearInterval(intervalId)
        isDone = true
        dispatch({ type: 'complete', payload: event.data.payload })
        resolve(event.data.payload)
      }

      window.addEventListener('message', messageListener)

      const intervalId = window.setInterval(() => {
        if (openedWindowRef.current && !openedWindowRef.current.closed) return

        clearInterval(intervalId)
        window.removeEventListener('message', messageListener)

        if (!isDone) {
          const payload = { message: "User closed the window" }
          dispatch({ type: 'cancel', payload })
          reject(payload)
        }
      }, 100)
    })
  }, [])

  const focus = useCallback(() => {
    openedWindowRef.current?.focus()
  }, [])

  return useMemo(() => ({ start, focus, state }), [start, focus, state])
}
