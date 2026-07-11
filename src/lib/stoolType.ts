import { PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType } from '@/api/generated/model';

/**
 * `stoolType` Chinese label map (issue #6 resolution comment): the backend `stoolType`
 * enum is used as-is, no custom frontend enum — kept here so the home quick-record chip
 * picker and `/bowel/new` share one source of truth (and issue #7's bowel history page
 * can reuse it too for consistent labels).
 */
export const STOOL_TYPE_LABELS: Record<PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType, string> = {
  normal: '正常',
  hard: '偏硬',
  soft: '偏軟',
  watery: '水便',
  bloody: '血便',
  mucous: '黏液便',
};

export const STOOL_TYPE_OPTIONS = Object.values(
  PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType,
) as PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType[];
