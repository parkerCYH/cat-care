import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  useGetApiV1CatCareCatsCatIdPlayers,
  usePutApiV1CatCareCatsCatIdChipPlayer,
} from '@/api/generated/cat-care/cat-care';
import { putApiV1CatCareCatsCatIdChipPlayerBody } from '@/api/generated-zod/cat-care/cat-care';
import type { PutApiV1CatCareCatsCatIdChipPlayer409, PutApiV1CatCareCatsCatIdChipPlayerBody } from '@/api/generated/model';
import { RetryButton } from '@/components/RetryState/RetryButton';

/**
 * `/cats/:id/transfer-chip` — standalone route, not a dialog (issue #9 resolution: this
 * needs an input — picking a target from existing members — so per the issue #4 routing
 * convention it's its own page). The target must already be a member, so this is a
 * `<select>` populated from `GET /cats/{catId}/players`, not a free-text email field.
 */
export function TransferChipPlayer() {
  const { id } = useParams<{ id: string }>();
  const catId = id ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const playersQuery = useGetApiV1CatCareCatsCatIdPlayers(catId);
  const mutation = usePutApiV1CatCareCatsCatIdChipPlayer();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PutApiV1CatCareCatsCatIdChipPlayerBody>({
    resolver: zodResolver(putApiV1CatCareCatsCatIdChipPlayerBody),
  });

  const players = playersQuery.data ?? [];

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      { catId, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          navigate(`/cats/${catId}`, { replace: true });
        },
        onError: (error) => {
          const axiosError = error as AxiosError<PutApiV1CatCareCatsCatIdChipPlayer409>;
          setError('email', {
            type: 'manual',
            message: axiosError.response?.data?.error ?? '轉移失敗,請再試一次',
          });
        },
      },
    );
  });

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">轉移晶片登記人</h1>

      {playersQuery.isLoading && <p className="text-sm text-gray-500">載入中…</p>}

      {playersQuery.isError && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-red-600">成員清單載入失敗</p>
          <RetryButton onRetry={() => playersQuery.refetch()} isPending={playersQuery.isFetching} />
        </div>
      )}

      {!playersQuery.isLoading && !playersQuery.isError && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              新的晶片登記人
            </label>
            <select
              id="email"
              {...register('email')}
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                請選擇成員
              </option>
              {players.map((player) => (
                <option key={player.id} value={player.email}>
                  {player.name} ({player.email})
                </option>
              ))}
            </select>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {mutation.isPending ? '送出中…' : '確認轉移'}
          </button>
        </form>
      )}
    </div>
  );
}
