// PROTOTYPE DATA — 票 04 定案的 34 項欄位清單，僅供 UI 稿展示分組/排版用，非正式型別。
export interface BloodworkField {
  key: string;
  label: string;
  unit: string;
}

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
  { key: 'lymPct', label: 'LYM%', unit: '%' },
  { key: 'monPct', label: 'MON%', unit: '%' },
  { key: 'graPct', label: 'GRA%', unit: '%' },
  { key: 'hgb', label: '血紅素 (HGB)', unit: 'g/dL' },
  { key: 'hct', label: '血比容 (HCT)', unit: '%' },
  { key: 'rbc', label: '紅血球 (RBC)', unit: '10¹²/L' },
  { key: 'mcv', label: 'MCV', unit: 'fL' },
  { key: 'mch', label: 'MCH', unit: 'pg' },
  { key: 'mchc', label: 'MCHC', unit: 'g/dL' },
  { key: 'rdwPct', label: 'RDW%', unit: '%' },
  { key: 'rdwa', label: 'RDWa', unit: 'fL' },
  { key: 'plt', label: '血小板 (PLT)', unit: '10⁹/L' },
  { key: 'mpv', label: 'MPV', unit: 'fL' },
];

// Variant B 用更細的四組分類展示「不同分組粒度」的可能性。
export const FINE_GROUPS: { label: string; fields: BloodworkField[] }[] = [
  { label: '電解質與滲透壓', fields: BIOCHEM_FIELDS.filter((f) => ['na', 'k', 'naK', 'cl', 'osmCalc'].includes(f.key)) },
  {
    label: '肝腎功能',
    fields: BIOCHEM_FIELDS.filter((f) => ['crea', 'bun', 'bunCrea', 'alt', 'alkp', 'tt4', 'fpl'].includes(f.key)),
  },
  {
    label: '蛋白質與血糖',
    fields: BIOCHEM_FIELDS.filter((f) => ['glu', 'tp', 'alb', 'glob', 'albGlob'].includes(f.key)),
  },
  { label: 'CBC 血球', fields: CBC_FIELDS },
];

/** 模擬 AI 辨識帶回的 draft 值——刻意不是每個欄位都有值，呼應票 04「每次驗血項目數量不同」的結論。 */
export function mockDraftValues(): Record<string, string> {
  return {
    glu: '112', crea: '1.4', bun: '28', bunCrea: '20', tp: '7.2', alb: '3.4', glob: '3.8', albGlob: '0.9',
    alt: '62', alkp: '34', na: '152', k: '4.3', naK: '35.3', cl: '118',
    wbc: '9.8', lym: '2.1', mono: '0.5', gran: '7.0', hgb: '11.2', hct: '38', rbc: '7.9',
    mcv: '48', mch: '14.2', mchc: '29.5', plt: '312',
  };
}
