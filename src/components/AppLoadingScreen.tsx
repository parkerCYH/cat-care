export interface AppLoadingScreenProps {
  /** 0、50、100 三個離散值(兩階段各佔 50%),不是連續動畫——見 `useAppReady` 的定案理由。 */
  progress: number;
  stageText: string;
}

/**
 * 票 04 視覺定案:全螢幕 splash(不疊加在現有畫面上),珊瑚色系,只有進度條 + 階段文案,不顯示
 * 精確百分比數字——進度是階段估算,顯示精確數字會給使用者錯誤的精準度期待。
 */
export function AppLoadingScreen({ progress, stageText }: AppLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#FAECE7] px-8">
      <div
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F0997B] text-4xl"
      >
        🐾
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-white/60"
        >
          <div
            className="h-full rounded-full bg-[#D85A30] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm font-medium text-[#D85A30]">{stageText}</p>
      </div>
    </div>
  );
}
