import { QueryClient } from '@tanstack/react-query';

// Mutations default to zero retries in TanStack Query v5 already, which matches issue #5's
// decision: no automatic retry / background queue for failed writes. A failed mutation is
// surfaced via the shared RetryButton / RetryListItem components and re-fires only when the
// user re-triggers `mutate()` themselves. Queries keep the library default retry behavior.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
