"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { SimplePaginationInfo } from "@/lib/github-api"

interface SimplePaginationProps {
  pagination: SimplePaginationInfo
  onPrevPage: () => void
  onNextPage: () => void
  loading?: boolean
}

export function SimplePagination({ pagination, onPrevPage, onNextPage, loading = false }: SimplePaginationProps) {
  if (!pagination.hasNext && !pagination.hasPrev) {
    return null
  }

  const getTotalPages = () => {
    if (pagination.totalCount && pagination.perPage) {
      return Math.ceil(pagination.totalCount / pagination.perPage)
    }
    return null
  }

  const totalPages = getTotalPages()

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {totalPages ? (
          <>
            {totalPages}ページ中 {pagination.currentPage}ページ目
            {pagination.totalCount && <span className="ml-2">（全{pagination.totalCount.toLocaleString()}件）</span>}
          </>
        ) : (
          `ページ ${pagination.currentPage}`
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!pagination.hasPrev || loading}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!pagination.hasNext || loading}
          className="flex items-center gap-1"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
