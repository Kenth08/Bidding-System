import React from 'react'

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded animate-pulse`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-4 border rounded-lg space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  )
}

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

export function SkeletonStatCard() {
  return (
    <div className="p-6 border rounded-lg space-y-2 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export default SkeletonLine
