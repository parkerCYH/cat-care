import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  getGetApiV1CatCareCatsCatIdQueryKey,
  useGetApiV1CatCareCatsCatId,
  useGetApiV1CatCareCatsCatIdPlayers,
  usePatchApiV1CatCareCatsCatId,
} from '@/api/generated/cat-care/cat-care';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { toDateParam } from '@/lib/date';

const formSchema = z.object({
  name: z.string().min(1, '請輸入名字'),
  birthdate: z
    .string()
    .optional()
    .refine((value) => !value || value <= toDateParam(new Date()), '出生日期不可為未來日期'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * `/cats/:id/edit` — 票 06 定案版面：name/birthdate/notes 表單 + 晶片登記人區塊(顯示目前登記人、
 * 連到既有 `TransferChipPlayer.tsx` 轉移頁)，取代原本因後端無 PATCH 而擋下來的唯讀 stub。
 */
export function CatEdit() {
  const { id } = useParams<{ id: string }>();
  const catId = id ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const catQuery = useGetApiV1CatCareCatsCatId(catId);
  const playersQuery = useGetApiV1CatCareCatsCatIdPlayers(catId);
  const cat = catQuery.data;
  const players = playersQuery.data ?? [];
  const chipPlayer = players.find((player) => player.id === cat?.chipPlayerId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (!cat) return;
    reset({
      name: cat.name,
      birthdate: cat.birthdate ?? '',
      notes: cat.notes ?? '',
    });
  }, [cat, reset]);

  const patchMutation = usePatchApiV1CatCareCatsCatId({
    mutation: {
      onSuccess: (updatedCat) => {
        queryClient.setQueryData(getGetApiV1CatCareCatsCatIdQueryKey(catId), updatedCat);
        navigate(`/cats/${catId}`, { replace: true });
      },
    },
  });

  const onSubmit = handleSubmit((values) => {
    patchMutation.mutate({
      catId,
      data: {
        name: values.name,
        birthdate: values.birthdate || undefined,
        notes: values.notes?.trim() || undefined,
      },
    });
  });

  if (catQuery.isLoading) {
    return <p className="px-4 py-8 text-center text-sm text-gray-500">載入中…</p>;
  }

  if (catQuery.isError || !cat) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-8">
        <p className="text-sm font-medium text-red-600">貓咪資料載入失敗</p>
        <RetryButton onRetry={() => catQuery.refetch()} isPending={catQuery.isFetching} />
      </div>
    );
  }

  if (cat.archivedAt) {
    return <Navigate to="/cats" replace />;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">編輯貓咪資料</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            名字
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="birthdate" className="mb-1 block text-sm font-medium text-gray-700">
            出生日期(選填)
          </label>
          <input
            id="birthdate"
            type="date"
            {...register('birthdate')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
            備註(選填)
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-400">晶片登記人</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-gray-900">
              {playersQuery.isLoading ? '載入中…' : (chipPlayer?.name ?? '尚未設定')}
            </p>
            <Link to={`/cats/${catId}/transfer-chip`} className="text-sm font-medium text-gray-600 underline">
              轉移
            </Link>
          </div>
        </div>

        {patchMutation.isError && <p className="text-sm text-red-600">儲存失敗,請再試一次</p>}

        <button
          type="submit"
          disabled={patchMutation.isPending}
          className="mt-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {patchMutation.isPending ? '儲存中…' : '儲存'}
        </button>

        <Link to={`/cats/${catId}`} className="text-center text-sm font-medium text-gray-600 underline">
          返回貓咪詳情
        </Link>
      </form>
    </div>
  );
}
