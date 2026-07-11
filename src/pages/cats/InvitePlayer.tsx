import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { usePostApiV1CatCareCatsCatIdPlayers } from '@/api/generated/cat-care/cat-care';
import { postApiV1CatCareCatsCatIdPlayersBody } from '@/api/generated-zod/cat-care/cat-care';
import type { PostApiV1CatCareCatsCatIdPlayers404, PostApiV1CatCareCatsCatIdPlayersBody } from '@/api/generated/model';

/**
 * `/cats/:id/invite` — invite by email (issue #9 resolution): waits for the actual API
 * response before leaving the page (no optimistic pending state — invite success is
 * immediate join, there is no pending-invite concept). 404 (no matching account) shows
 * inline and keeps the entered email so the user can fix a typo.
 */
export function InvitePlayer() {
  const { id } = useParams<{ id: string }>();
  const catId = id ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = usePostApiV1CatCareCatsCatIdPlayers();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PostApiV1CatCareCatsCatIdPlayersBody>({
    resolver: zodResolver(postApiV1CatCareCatsCatIdPlayersBody),
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      { catId, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          navigate(`/cats/${catId}`, { replace: true });
        },
        onError: (error) => {
          const axiosError = error as AxiosError<PostApiV1CatCareCatsCatIdPlayers404>;
          if (axiosError.response?.status === 404) {
            setError('email', { type: 'manual', message: '查無此帳號,請確認 Email 是否已註冊' });
          } else {
            setError('email', { type: 'manual', message: '邀請失敗,請再試一次' });
          }
        },
      },
    );
  });

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">邀請共同照護者</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {mutation.isPending ? '送出中…' : '送出邀請'}
        </button>
      </form>
    </div>
  );
}
