// Testing the OAuth hook
import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

// Test to verify initial loading state is false
test('should initial loading to be false', (): void => {
  const { result } = renderHook(() => useOAuth())
  expect(result.current.state.isLoading).toBe(false)
})