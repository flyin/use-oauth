import { renderHook } from '@testing-library/react-hooks'
import { useOAuth } from '../index'

test('should initial loading to be false', (): void => {
  const { result } = renderHook(() => useOAuth())
  expect(result.current.state.isLoading).toBe(false)
})
