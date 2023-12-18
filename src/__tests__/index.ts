// Import necessary testing utilities from the React Testing Library
import { renderHook } from '@testing-library/react-hooks';
import { useOAuth } from '../index';

// Unit test to ensure that the initial loading state is false
test('should initial loading to be false', (): void => {
  // Render the custom useOAuth hook in a test environment
  const { result } = renderHook(() => useOAuth());
  // Assert that the initial isLoading value is false
  expect(result.current.state.isLoading).toBe(false);
})
