import type { GetApiV1CatCareCatsCatIdBowelMovements200ItemStoolType } from '@/api/generated/model';

/**
 * Chinese display labels for the backend `stoolType` enum — decided once in issue #6
 * (首頁/快速記錄規格) and reused verbatim here per the issue #7 resolution comment
 * ("形狀欄位沿用 #6 定案的中文對照表,不重複定義").
 */
export const STOOL_TYPE_LABELS: Record<
  NonNullable<GetApiV1CatCareCatsCatIdBowelMovements200ItemStoolType>,
  string
> = {
  normal: '正常',
  hard: '偏硬',
  soft: '偏軟',
  watery: '水便',
  bloody: '血便',
  mucous: '黏液便',
};

export function formatStoolType(
  stoolType: GetApiV1CatCareCatsCatIdBowelMovements200ItemStoolType | undefined,
): string {
  if (!stoolType) return '未記錄形狀';
  return STOOL_TYPE_LABELS[stoolType] ?? stoolType;
}
