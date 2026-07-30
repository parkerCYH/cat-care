interface HealthAdviceItem {
  advice: {
    abnormalFindings: string[];
    possibleCauses: string[];
    recommendedActions: string[];
  };
  createdAt: string;
}

/**
 * 票 23：健康建議的結構化內容渲染（異常指標／可能原因／建議行動三區塊，票 14 定案），
 * 觸發後的結果與歷史查看共用同一份呈現，不重打一份排版。
 */
export function HealthAdviceCard({ advice, createdAt }: HealthAdviceItem) {
  const generatedAt = new Date(createdAt);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400">
        {generatedAt.getFullYear()}/{String(generatedAt.getMonth() + 1).padStart(2, '0')}/
        {String(generatedAt.getDate()).padStart(2, '0')} {String(generatedAt.getHours()).padStart(2, '0')}:
        {String(generatedAt.getMinutes()).padStart(2, '0')} 產生
      </p>
      <AdviceSection title="異常指標" items={advice.abnormalFindings} />
      <AdviceSection title="可能原因" items={advice.possibleCauses} />
      <AdviceSection title="建議行動" items={advice.recommendedActions} />
    </div>
  );
}

function AdviceSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <ul className="flex flex-col gap-1 pl-4">
        {items.map((item, index) => (
          <li key={index} className="list-disc text-sm text-gray-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
