"use client"

import { useState } from "react"
import { getRelativeTime, formatExactDateTime } from "@/lib/github-api"

interface RelativeTimeProps {
  dateString: string
  className?: string
}

export function RelativeTime({ dateString, className }: RelativeTimeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const relativeTime = getRelativeTime(dateString)
  const exactDateTime = formatExactDateTime(dateString)

  return (
    <div className="relative inline-block">
      <span
        className={`cursor-help ${className || ""}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {relativeTime}
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs rounded shadow-lg z-50 whitespace-nowrap">
          {exactDateTime}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  )
}
