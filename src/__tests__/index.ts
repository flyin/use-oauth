// Import utilities for testing React hooks
import { renderHook } from '@testing-library/react-hooks'
// Import the custom hook we want to test
import { useOAuth } from '../index'

// Define a test to ensure that the initial loading state is false
test('should initial loading to be false', (): void => {
  // Render the custom hook and destructure its result
  const { result } = renderHook(() => useOAuth())
  // Assert that the initial isLoading state is false
  expect(result.current.state.isLoading).toBe(false)
})