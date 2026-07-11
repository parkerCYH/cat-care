import { useEffect, useState } from 'react';

/**
 * Confirms before leaving a page via the browser back button (issue #6 resolution:
 * `/bowel/new` and `/weight/new` both need this so an accidental back-press doesn't
 * silently discard in-progress input). Purely a back-button interceptor — plug the
 * returned state into a <ConfirmDialog> at the call site (issue #4 convention: a pure
 * yes/no confirm is a dialog, not a route).
 *
 * Mechanics: on mount we push a duplicate history entry ("guard"). The first back-press
 * only pops that duplicate (the URL doesn't actually change), which fires `popstate` and
 * lets us intercept it with a confirm dialog instead of really navigating away. Cancelling
 * re-plants the guard; confirming pops two entries so the *next* back lands on the real
 * previous page.
 */
export function useConfirmBackNavigation(active: boolean) {
  const [pendingLeave, setPendingLeave] = useState(false);

  useEffect(() => {
    if (!active) return;

    window.history.pushState(null, '', window.location.href);

    function handlePopState() {
      setPendingLeave(true);
      window.history.pushState(null, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [active]);

  function confirmLeave() {
    setPendingLeave(false);
    window.history.go(-2);
  }

  function cancelLeave() {
    setPendingLeave(false);
  }

  return { pendingLeave, confirmLeave, cancelLeave };
}
