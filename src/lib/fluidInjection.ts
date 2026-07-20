import {
  PostApiV1CatCareCatsCatIdFluidInjectionsBodySite,
  PostApiV1CatCareCatsCatIdFluidInjectionsBodyFluidType,
} from '@/api/generated/model';
import type {
  GetApiV1CatCareCatsCatIdFluidInjections200ItemSite,
  GetApiV1CatCareCatsCatIdFluidInjections200ItemFluidType,
} from '@/api/generated/model';

/**
 * `site`/`fluidType` Chinese label maps (wayfinder cat-care-fluid-injection-record 票 01
 * 決議): backend enums used as-is, no custom frontend enum — shared source of truth for the
 * home summary, `/fluid-injection/new`, history list/detail/edit.
 */
export const SITE_LABELS: Record<PostApiV1CatCareCatsCatIdFluidInjectionsBodySite, string> = {
  left: '左側',
  right: '右側',
  nape: '後頸',
  other: '其他',
};

export const SITE_OPTIONS = Object.values(
  PostApiV1CatCareCatsCatIdFluidInjectionsBodySite,
) as PostApiV1CatCareCatsCatIdFluidInjectionsBodySite[];

export const FLUID_TYPE_LABELS: Record<PostApiV1CatCareCatsCatIdFluidInjectionsBodyFluidType, string> = {
  normalSaline: '生理食鹽水',
  lactatedRingers: '乳酸林格氏液',
  other: '其他',
};

export const FLUID_TYPE_OPTIONS = Object.values(
  PostApiV1CatCareCatsCatIdFluidInjectionsBodyFluidType,
) as PostApiV1CatCareCatsCatIdFluidInjectionsBodyFluidType[];

/** 票 03 定案文案，放在表單頂部提示區塊。 */
export const CHIP_HINT_TEXT = '晶片通常植入於後頸，若貓咪已登記晶片，建議選擇左側或右側點滴';

export function formatSite(
  site: GetApiV1CatCareCatsCatIdFluidInjections200ItemSite,
  siteOther?: string | null,
): string {
  if (site === 'other') return siteOther || SITE_LABELS.other;
  return SITE_LABELS[site] ?? site;
}

export function formatFluidType(
  fluidType: GetApiV1CatCareCatsCatIdFluidInjections200ItemFluidType,
  fluidTypeOther?: string | null,
): string {
  if (fluidType === 'other') return fluidTypeOther || FLUID_TYPE_LABELS.other;
  return FLUID_TYPE_LABELS[fluidType] ?? fluidType;
}

export function formatVolume(volumeMl: number): string {
  return `${volumeMl} ml`;
}
