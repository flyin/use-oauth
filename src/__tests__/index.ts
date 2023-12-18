// Importing utilities from the 'react-hooks' testing library
import { renderHook } from '@testing-library/react-hooks';
import { useOAuth } from '../index';

// Unit tests for the 'useOAuth' custom hook
test('should initial loading to be false', (): void => {
  // Setup render hook for testing
  const { result } = renderHook(() => useOAuth());
  // Assert initial loading state to be false
  expect(result.current.state.isLoading).toBe(false);
})