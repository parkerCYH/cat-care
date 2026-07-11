import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { NotFound } from '@/pages/NotFound';
import { CatsList } from '@/pages/cats/CatsList';
import { CatDetail } from '@/pages/cats/CatDetail';
import { CatNew } from '@/pages/cats/CatNew';
import { CatEdit } from '@/pages/cats/CatEdit';
import { InvitePlayer } from '@/pages/cats/InvitePlayer';
import { TransferChipPlayer } from '@/pages/cats/TransferChipPlayer';

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
      // issue #9 — cat management (list/detail/create/edit + player invite/leave/chip-
      // custodian transfer). See docs/agents/init-frontend.md for the multi-agent build
      // note: conflicts with sibling agents editing this same children array in their
      // own worktrees are expected and reconciled by the phase-2 integration pass.
      {
        path: '/cats',
        element: <CatsList />,
      },
      {
        path: '/cats/new',
        element: <CatNew />,
      },
      {
        path: '/cats/:id',
        element: <CatDetail />,
      },
      {
        path: '/cats/:id/edit',
        element: <CatEdit />,
      },
      {
        path: '/cats/:id/invite',
        element: <InvitePlayer />,
      },
      {
        path: '/cats/:id/transfer-chip',
        element: <TransferChipPlayer />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
