import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { NotFound } from '@/pages/NotFound';
import { BowelCalendar } from '@/pages/bowel/BowelCalendar';
import { BowelTable } from '@/pages/bowel/BowelTable';
import { BowelDetail } from '@/pages/bowel/BowelDetail';
import { BowelEdit } from '@/pages/bowel/BowelEdit';

/**
 * Route shell for phase 0. Phase-1 feature agents (issues #6-#9) add their own routes
 * as siblings of Home under the AppLayout element — see docs/agents/init-frontend.md.
 * Convention (issue #4): any screen with an input field is its own route here; a pure
 * yes/no confirmation is a <ConfirmDialog> (src/components/ConfirmDialog.tsx), never a
 * route. Final route table lands in issue #10 during the phase-2 integration pass.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Home />,
      },
      // Issue #7 (排便歷史規格): calendar is the default view, table is the filterable
      // list view; both are top-level siblings, detail/edit are reached from within.
      {
        path: '/bowel/calendar',
        element: <BowelCalendar />,
      },
      {
        path: '/bowel/table',
        element: <BowelTable />,
      },
      {
        path: '/bowel/:id',
        element: <BowelDetail />,
      },
      {
        path: '/bowel/:id/edit',
        element: <BowelEdit />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
