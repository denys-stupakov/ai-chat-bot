import React from "react"

export default function SavingsBar({ current = 400, goal = 800, month = "AUG" }) {
  const percent = Math.min(100, Math.max(0, (current / goal) * 100))

  return (
    <div className="flex flex-col items-center">
      <span className="text-text-gray font-regular">{goal}</span>

      <div className="relative w-18 h-64 bg-white rounded-full overflow-hidden my-2">

        <div
          className="absolute bottom-[3px] left-[3px] right-[3px] bg-blue rounded-full transition-all duration-700 ease-out"
          style={{ height: `calc(${percent}% - 4px)` }}
        ></div>

        <span
          className="absolute left-1/2 -translate-x-1/2 text-blue-600 font-regular"
          style={{ bottom: `${percent + 5}%` }}
        >
          {current}
        </span>
      </div>

      <span className="text-gray-600 font-regular">{month}</span>
    </div>
  )
}
