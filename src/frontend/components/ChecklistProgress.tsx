"use client"

export default function ChecklistProgress({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>
          Sprint {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}