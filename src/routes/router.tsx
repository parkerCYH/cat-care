import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Home } from '@/pages/Home';
import { BowelNew } from '@/pages/BowelNew';
import { WeightNew } from '@/pages/WeightNew';
import { FluidInjectionNew } from '@/pages/FluidInjectionNew';
import { BloodworkNew } from '@/pages/BloodworkNew';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { NotFound } from '@/pages/NotFound';
import { BowelCalendar } from '@/pages/bowel/BowelCalendar';
import { BowelTable } from '@/pages/bowel/BowelTable';
import { BowelDetail } from '@/pages/bowel/BowelDetail';
import { BowelEdit } from '@/pages/bowel/BowelEdit';
import { WeightChartPage } from '@/pages/weight/WeightChartPage';
import { WeightTablePage } from '@/pages/weight/WeightTablePage';
import { WeightDetailPage } from '@/pages/weight/WeightDetailPage';
import { WeightEditPage } from '@/pages/weight/WeightEditPage';
import { FluidInjectionTable } from '@/pages/fluidInjection/FluidInjectionTable';
import { FluidInjectionDetail } from '@/pages/fluidInjection/FluidInjectionDetail';
import { FluidInjectionEdit } from '@/pages/fluidInjection/FluidInjectionEdit';
import { BloodworkDetail } from '@/pages/bloodwork/BloodworkDetail';
import { BloodworkPhoto } from '@/pages/bloodwork/BloodworkPhoto';
import { BloodworkTable } from '@/pages/bloodwork/BloodworkTable';
import { BloodworkHealthAdvice } from '@/pages/bloodwork/BloodworkHealthAdvice';
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
      {
        path: '/bowel/new',
        element: <BowelNew />,
      },
      {
        path: '/weight/new',
        element: <WeightNew />,
      },
      {
        path: '/fluid-injection/new',
        element: <FluidInjectionNew />,
      },
      // 票 19 — 手動填寫驗血紀錄(比照原型 VariantA 的手動填寫分支)
      {
        path: '/bloodwork/new',
        element: <BloodworkNew />,
      },
      // 票 21 — 拍照辨識驗血紀錄(比照原型 VariantA 的拍照辨識分支)
      {
        path: '/bloodwork/photo',
        element: <BloodworkPhoto />,
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
      // issue #8 — weight history (chart is the default entry point, table is secondary)
      {
        path: '/weight/chart',
        element: <WeightChartPage />,
      },
      {
        path: '/weight/table',
        element: <WeightTablePage />,
      },
      {
        path: '/weight/:id',
        element: <WeightDetailPage />,
      },
      {
        path: '/weight/:id/edit',
        element: <WeightEditPage />,
      },
      // 票 04 — 皮下點滴紀錄歷史(單純列表,無 abnormal 篩選需求,不另設日曆檢視)
      {
        path: '/fluid-injection/table',
        element: <FluidInjectionTable />,
      },
      {
        path: '/fluid-injection/:id',
        element: <FluidInjectionDetail />,
      },
      {
        path: '/fluid-injection/:id/edit',
        element: <FluidInjectionEdit />,
      },
      {
        path: '/bloodwork/:id',
        element: <BloodworkDetail />,
      },
      // 票 23 — 驗血歷史列表(多選)與取得健康建議的觸發＋結果頁
      {
        path: '/bloodwork/table',
        element: <BloodworkTable />,
      },
      {
        path: '/bloodwork/health-advice',
        element: <BloodworkHealthAdvice />,
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
