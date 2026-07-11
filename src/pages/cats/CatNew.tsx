import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { usePostApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';
import { postApiV1CatCareCatsBody } from '@/api/generated-zod/cat-care/cat-care';
import type { PostApiV1CatCareCatsBody } from '@/api/generated/model';

/**
 * `/cats/new` — independent page, back-navigation only (issue #4 pattern: any screen
 * with an input field is its own route). On success, navigates to the new cat's detail
 * page per the resolution reference input.
 */
export function CatNew() {
  const navigate = useNavigate();
  const mutation = usePostApiV1CatCareCats();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostApiV1CatCareCatsBody>({
    resolver: zodResolver(postApiV1CatCareCatsBody),
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      { data: values },
      {
        onSuccess: (cat) => {
          navigate(`/cats/${cat.id}`, { replace: true });
        },
      },
    );
  });

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">新增貓咪</h1>

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

        {mutation.isError && <p className="text-sm text-red-600">新增失敗,請再試一次</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {mutation.isPending ? '送出中…' : '新增'}
        </button>
      </form>
    </div>
  );
}
