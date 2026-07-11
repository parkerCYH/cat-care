import { PostApiV1CatCareCatsCatIdWeightRecordsBodyMethod } from '@/api/generated/model';

/** `method` Chinese label map — same pattern as stoolType, backend enum used as-is. */
export const WEIGHT_METHOD_LABELS: Record<PostApiV1CatCareCatsCatIdWeightRecordsBodyMethod, string> = {
  catScale: '貓用體重計',
  holdAndSubtract: '抱貓後扣重',
  other: '其他',
};

export const WEIGHT_METHOD_OPTIONS = Object.values(
  PostApiV1CatCareCatsCatIdWeightRecordsBodyMethod,
) as PostApiV1CatCareCatsCatIdWeightRecordsBodyMethod[];

/** Local-storage key for remembering the user's last-picked measuring method (issue #6). */
export const WEIGHT_METHOD_STORAGE_KEY = 'cat-care:last-weight-method';
