import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteApiV1CatCareCatsCatId,
  useDeleteApiV1CatCareCatsCatIdPlayersMe,
  useGetApiV1CatCareCatsCatId,
  useGetApiV1CatCareCatsCatIdPlayers,
} from '@/api/generated/cat-care/cat-care';
import type { DeleteApiV1CatCareCatsCatIdPlayersMe409 } from '@/api/generated/model';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { useCurrentPlayerId } from './useCurrentPlayerId';
import type { AxiosError } from 'axios';

/**
 * `/cats/:id` — cat detail (issue #9 resolution): read-only basic info + "編輯基本資料"
 * button, player list with "(你)" / custodian badge, invite button, archive ("刪除") and
 * leave actions.
 */
export function CatDetail() {
  const { id } = useParams<{ id: string }>();
  const catId = id ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentPlayerId = useCurrentPlayerId();

  const catQuery = useGetApiV1CatCareCatsCatId(catId);
  const playersQuery = useGetApiV1CatCareCatsCatIdPlayers(catId);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const archiveMutation = useDeleteApiV1CatCareCatsCatId();
  const leaveMutation = useDeleteApiV1CatCareCatsCatIdPlayersMe();

  const cat = catQuery.data;
  const players = playersQuery.data ?? [];

  const handleArchiveConfirm = () => {
    archiveMutation.mutate(
      { catId },
      {
        onSuccess: () => {
          setArchiveOpen(false);
          queryClient.invalidateQueries();
          navigate('/cats', { replace: true });
        },
      },
    );
  };

  const handleLeaveConfirm = () => {
    setLeaveError(null);
    leaveMutation.mutate(
      { catId },
      {
        onSuccess: () => {
          setLeaveOpen(false);
          queryClient.invalidateQueries();
          navigate('/cats', { replace: true });
        },
        onError: (error) => {
          const axiosError = error as AxiosError<DeleteApiV1CatCareCatsCatIdPlayersMe409>;
          setLeaveError(axiosError.response?.data?.error ?? '退出失敗,請再試一次');
        },
      },
    );
  };

  const openLeaveDialog = () => {
    setLeaveError(null);
    setLeaveOpen(true);
  };

  if (catQuery.isLoading) {
    return <p className="px-4 py-8 text-center text-sm text-gray-500">載入中…</p>;
  }

  if (catQuery.isError || !cat) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-600">貓咪資料載入失敗</p>
        <RetryButton onRetry={() => catQuery.refetch()} isPending={catQuery.isFetching} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{cat.name}</h1>
          <Link to={`/cats/${catId}/edit`} className="text-sm font-medium text-gray-600 underline">
            編輯基本資料
          </Link>
        </div>
        <dl className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex gap-2">
            <dt className="text-gray-400">出生日期</dt>
            <dd>{cat.birthdate ?? '未填寫'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-400">備註</dt>
            <dd className="flex-1">{cat.notes ?? '未填寫'}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">共同照護者</h2>
          <Link
            to={`/cats/${catId}/invite`}
            className="rounded-full bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + 邀請
          </Link>
        </div>

        {playersQuery.isLoading && <p className="text-sm text-gray-500">載入中…</p>}

        {playersQuery.isError && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-red-600">成員清單載入失敗</p>
            <RetryButton onRetry={() => playersQuery.refetch()} isPending={playersQuery.isFetching} />
          </div>
        )}

        {!playersQuery.isLoading && !playersQuery.isError && (
          <ul className="flex flex-col gap-2">
            {players.map((player) => {
              const isMe = player.id === currentPlayerId;
              const isChipPlayer = player.id === cat.chipPlayerId;
              return (
                <li
                  key={player.id}
                  className="flex min-h-[56px] items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-gray-900">{player.name}</span>
                      {isMe && <span className="text-xs text-gray-400">(你)</span>}
                      {isChipPlayer && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          晶片登記人
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">{player.email}</p>
                  </div>
                  {isMe && (
                    <button
                      type="button"
                      onClick={openLeaveDialog}
                      className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700"
                    >
                      退出
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setArchiveOpen(true)}
          className="text-sm font-medium text-red-600 underline"
        >
          刪除這隻貓咪
        </button>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="刪除貓咪"
        description={`確定要刪除「${cat.name}」嗎?刪除後將從清單中消失。`}
        danger
        confirmLabel={archiveMutation.isPending ? '處理中…' : '確定刪除'}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveOpen(false)}
      />

      <LeaveConfirmDialog
        open={leaveOpen}
        catId={catId}
        errorMessage={leaveError}
        canTransfer={players.length > 1}
        isPending={leaveMutation.isPending}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
