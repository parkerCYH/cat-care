export interface BloodworkField {
  key: string;
  label: string;
  unit: string;
}

/**
 * 34 項驗血欄位（parker-api 票 18 定案，見 docs/services/parker-api/cat-care.md「驗血紀錄」段落）。
 * key 對應後端 API 欄位名稱，兩區塊（生化／CBC）供表單分組與明細頁顯示共用。
 */
export const BIOCHEM_FIELDS: BloodworkField[] = [
  { key: 'glu', label: '血糖 (GLU)', unit: 'mg/dL' },
  { key: 'crea', label: '肌酸酐 (CREA)', unit: 'mg/dL' },
  { key: 'bun', label: '血中尿素氮 (BUN)', unit: 'mg/dL' },
  { key: 'bunCrea', label: 'BUN/CREA 比值', unit: '' },
  { key: 'tp', label: '總蛋白 (TP)', unit: 'g/dL' },
  { key: 'alb', label: '白蛋白 (ALB)', unit: 'g/dL' },
  { key: 'glob', label: '球蛋白 (GLOB)', unit: 'g/dL' },
  { key: 'albGlob', label: 'ALB/GLOB 比值', unit: '' },
  { key: 'alt', label: '丙胺酸轉氨酶 (ALT)', unit: 'U/L' },
  { key: 'alkp', label: '鹼性磷酸酶 (ALKP)', unit: 'U/L' },
  { key: 'fpl', label: '胰臟脂肪酶 (fPL)', unit: 'U/L' },
  { key: 'na', label: '鈉離子 (Na)', unit: 'mmol/L' },
  { key: 'k', label: '鉀離子 (K)', unit: 'mmol/L' },
  { key: 'naK', label: 'Na/K 比值', unit: '' },
  { key: 'cl', label: '氯離子 (CL)', unit: 'mmol/L' },
  { key: 'osmCalc', label: '估算滲透壓 (Osm Calc)', unit: 'mmol/kg' },
  { key: 'tt4', label: '總甲狀腺素 (TT4)', unit: 'µg/dL' },
];

export const CBC_FIELDS: BloodworkField[] = [
  { key: 'wbc', label: '白血球 (WBC)', unit: '10⁹/L' },
  { key: 'lym', label: '淋巴球 (LYM)', unit: '10⁹/L' },
  { key: 'mono', label: '單核球 (MONO)', unit: '10⁹/L' },
  { key: 'gran', label: '顆粒球 (GRAN)', unit: '10⁹/L' },
  { key: 'lymPercent', label: 'LYM%', unit: '%' },
  { key: 'monPercent', label: 'MON%', unit: '%' },
  { key: 'graPercent', label: 'GRA%', unit: '%' },
  { key: 'hgb', label: '血紅素 (HGB)', unit: 'g/dL' },
  { key: 'hct', label: '血比容 (HCT)', unit: '%' },
  { key: 'rbc', label: '紅血球 (RBC)', unit: '10¹²/L' },
  { key: 'mcv', label: 'MCV', unit: 'fL' },
  { key: 'mch', label: 'MCH', unit: 'pg' },
  { key: 'mchc', label: 'MCHC', unit: 'g/dL' },
  { key: 'rdwPercent', label: 'RDW%', unit: '%' },
  { key: 'rdwa', label: 'RDWa', unit: 'fL' },
  { key: 'plt', label: '血小板 (PLT)', unit: '10⁹/L' },
  { key: 'mpv', label: 'MPV', unit: 'fL' },
];

export const BLOODWORK_FIELDS: BloodworkField[] = [...BIOCHEM_FIELDS, ...CBC_FIELDS];

export function formatBloodworkValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '未填寫';
  return unit ? `${value} ${unit}` : `${value}`;
}
