import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

test('should initial loading to be false', () => {
  const { result } = renderHook(() => useOAuth())
  expect(result.current.state.isLoading).toBe(false)
})

// The test file didn't need any adjustments as it tests the initial state correctly.
