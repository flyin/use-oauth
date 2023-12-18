import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

// Test to verify that initial loading state is false.
test('should initial loading to be false', (): void => {
  const { result } = renderHook(() => useOAuth())
  
  // Expect the isLoading state to be false initially.
  expect(result.current.state.isLoading).toBe(false)
})