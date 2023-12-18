import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

// Unit test for the initial state of the useOAuth hook
test('should initial loading to be false', (): void => {
  // Use the renderHook function to test the custom hook
  const { result } = renderHook(() => useOAuth())
  // Assert that the isLoading state is initialized as false
  expect(result.current.state.isLoading).toBe(false)
})
