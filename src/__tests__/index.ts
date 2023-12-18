import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

// Test case for the initial loading state of the OAuth hook
test('should initial loading to be false', (): void => {
  // Render the hook for testing
  const { result } = renderHook(() => useOAuth())
  // Assert that the initial isLoading state is false
  expect(result.current.state.isLoading).toBe(false)
})
