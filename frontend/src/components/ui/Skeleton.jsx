import React from 'react'

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array(cols).fill(0).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}
