"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bug, Search, User } from "lucide-react"
import { useApiKey } from "@/components/api-key-provider"
import { ApiKeySetup } from "@/components/api-key-setup"
import { RepositoryHeader } from "@/components/repository-header"
import { SimplePagination } from "@/components/simple-pagination"
import {
  GitHubAPI,
  type Repository,
  type Issue,
  type Label as GitHubLabel,
  type SimplePaginationInfo,
  getContrastYIQ,
} from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { RelativeTime } from "@/components/relative-time"

export default function IssuesPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const { apiKey } = useApiKey()
  const { toast } = useToast()

  const [repository, setRepository] = useState<Repository | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [pagination, setPagination] = useState<SimplePaginationInfo>({
    hasNext: false,
    hasPrev: false,
    currentPage: 1,
  })
  const [loading, setLoading] = useState(false)

  // 入力用の状態
  const [searchInput, setSearchInput] = useState("")
  const [authorInput, setAuthorInput] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"created" | "updated" | "comments">("created")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // 適用済みの検索条件
  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedAuthor, setAppliedAuthor] = useState("")
  const [appliedLabels, setAppliedLabels] = useState<string[]>([])
  const [appliedSortBy, setAppliedSortBy] = useState<"created" | "updated" | "comments">("created")
  const [appliedSortDirection, setAppliedSortDirection] = useState<"asc" | "desc">("desc")

  const [availableLabels, setAvailableLabels] = useState<GitHubLabel[]>([])

  useEffect(() => {
    if (apiKey && owner && repo) {
      fetchRepositoryAndLabels()
      fetchIssues()
    }
  }, [apiKey, owner, repo])

  const fetchRepositoryAndLabels = async () => {
    if (!apiKey) return

    try {
      const api = new GitHubAPI(apiKey)
      const [repoData, labelsData] = await Promise.all([api.getRepository(owner, repo), api.getLabels(owner, repo)])

      setRepository(repoData)
      setAvailableLabels(labelsData)
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "データの取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const buildSearchQuery = useCallback(() => {
    let query = appliedSearch.trim()

    // ラベルフィルター
    if (appliedLabels.length > 0) {
      appliedLabels.forEach((label) => {
        query += ` label:"${label}"`
      })
    }

    // 作成者フィルター
    if (appliedAuthor.trim()) {
      query += ` author:${appliedAuthor.trim()}`
    }

    return query
  }, [appliedSearch, appliedLabels, appliedAuthor])

  const fetchIssues = useCallback(async () => {
    if (!apiKey) return

    setLoading(true)
    try {
      const api = new GitHubAPI(apiKey)
      const query = buildSearchQuery()
      const result = await api.searchIssues(owner, repo, query, 1, 30, appliedSortBy, appliedSortDirection)

      setIssues(result.items)
      setPagination(result.pagination)
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "Issueの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [apiKey, owner, repo, buildSearchQuery, appliedSortBy, appliedSortDirection, toast])

  const fetchByUrl = useCallback(
    async (url: string) => {
      if (!apiKey) return

      setLoading(true)
      try {
        const api = new GitHubAPI(apiKey)
        const result = await api.requestByUrl(url)

        // 検索結果の形式に合わせる
        setIssues(result.data.items || [])

        if (result.pagination) {
          // total_countがある場合は追加
          if (result.data.total_count) {
            result.pagination.totalCount = result.data.total_count
            result.pagination.perPage = 30 // 現在の設定値と合わせる
          }
          setPagination(result.pagination)
        }
      } catch (error) {
        toast({
          title: "エラー",
          description: error instanceof Error ? error.message : "データの取得に失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [apiKey, toast],
  )

  const handleSearch = () => {
    // 入力値を適用済み状態にコピー
    setAppliedSearch(searchInput)
    setAppliedAuthor(authorInput)
    setAppliedLabels([...selectedLabels])
    setAppliedSortBy(sortBy)
    setAppliedSortDirection(sortDirection)

    // 検索実行は次のuseEffectで行われる
  }

  // Enterキーでの検索実行
  const handleKeywordEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setAppliedSearch(searchInput)
      setAppliedAuthor(authorInput)
      setAppliedLabels([...selectedLabels])
      setAppliedSortBy(sortBy)
      setAppliedSortDirection(sortDirection)

      toast({
        title: "検索実行",
        description: "Enterキーで検索を実行しました",
      })
    }
  }

  const handleAuthorEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setAppliedSearch(searchInput)
      setAppliedAuthor(authorInput)
      setAppliedLabels([...selectedLabels])
      setAppliedSortBy(sortBy)
      setAppliedSortDirection(sortDirection)

      toast({
        title: "検索実行",
        description: "作成者フィルターで検索を実行しました",
      })
    }
  }

  // 適用済み条件が変更されたときに検索実行
  useEffect(() => {
    if (apiKey && owner && repo) {
      fetchIssues()
    }
  }, [appliedSearch, appliedAuthor, appliedLabels, appliedSortBy, appliedSortDirection])

  const handleUserClick = (username: string) => {
    setAuthorInput(username)
    setAppliedAuthor(username)
    toast({
      title: "フィルター適用",
      description: `作成者「${username}」で絞り込みました`,
    })
  }

  const handleLabelClick = (labelName: string) => {
    // 既に選択されているかチェック
    if (appliedLabels.includes(labelName)) {
      toast({
        title: "既に適用済み",
        description: `ラベル「${labelName}」は既に絞り込み条件に含まれています`,
      })
      return
    }

    // 入力フィールドの状態も更新
    const newSelectedLabels = [...selectedLabels, labelName]
    setSelectedLabels(newSelectedLabels)

    // 適用済み状態も更新
    const newAppliedLabels = [...appliedLabels, labelName]
    setAppliedLabels(newAppliedLabels)

    toast({
      title: "フィルター追加",
      description: `ラベル「${labelName}」で絞り込みました`,
    })
  }

  const handleNextPage = () => {
    if (pagination.nextUrl) {
      fetchByUrl(pagination.nextUrl)
    }
  }

  const handlePrevPage = () => {
    if (pagination.prevUrl) {
      fetchByUrl(pagination.prevUrl)
    }
  }

  const clearSearch = () => {
    setSearchInput("")
    setAuthorInput("")
    setSelectedLabels([])
    setSortBy("created")
    setSortDirection("desc")

    setAppliedSearch("")
    setAppliedAuthor("")
    setAppliedLabels([])
    setAppliedSortBy("created")
    setAppliedSortDirection("desc")
  }

  const handleLabelChange = (labelName: string, checked: boolean) => {
    if (checked) {
      setSelectedLabels([...selectedLabels, labelName])
    } else {
      setSelectedLabels(selectedLabels.filter((l) => l !== labelName))
    }
  }

  if (!apiKey) {
    return <ApiKeySetup />
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  const hasActiveFilters = appliedSearch || appliedAuthor || appliedLabels.length > 0

  return (
    <div className="bg-background">
      <RepositoryHeader repository={repository} />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">Issues</h2>
            <Link href={`/${owner}/${repo}/pulls`} className="text-muted-foreground hover:text-primary">
              Pull requests
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">検索・ソート</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="issue-search" className="mb-1 block">
                    キーワードで絞り込み
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="issue-search"
                      placeholder="タイトル、説明で検索... (Enterで実行)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleKeywordEnter}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="author-search" className="mb-1 block">
                    作成者で絞り込み
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="author-search"
                      placeholder="ユーザー名を入力... (Enterで実行)"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      onKeyDown={handleAuthorEnter}
                      className="pl-10"
                    />
                  </div>
                </div>

                {availableLabels.length > 0 && (
                  <div>
                    <Label className="mb-1 block">ラベルで絞り込み</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableLabels.map((label) => (
                        <div key={label.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`issue-label-${label.id}`}
                            checked={selectedLabels.includes(label.name)}
                            onChange={(e) => handleLabelChange(label.name, e.target.checked)}
                            className="mr-2"
                          />
                          <label
                            htmlFor={`issue-label-${label.id}`}
                            className="flex items-center cursor-pointer flex-1"
                          >
                            <span
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: `#${label.color}` }}
                            ></span>
                            <span className="text-sm truncate" title={label.description || label.name}>
                              {label.name}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="mb-1 block">並び替え</Label>
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [newSortBy, newSortDirection] = e.target.value.split("-") as [
                        "created" | "updated" | "comments",
                        "asc" | "desc",
                      ]
                      setSortBy(newSortBy)
                      setSortDirection(newSortDirection)
                    }}
                    className="w-full p-2 border rounded-md"
                    disabled={loading}
                  >
                    <option value="created-desc">作成日 (新しい順)</option>
                    <option value="created-asc">作成日 (古い順)</option>
                    <option value="updated-desc">更新日 (新しい順)</option>
                    <option value="updated-asc">更新日 (古い順)</option>
                    <option value="comments-desc">コメント (多い順)</option>
                    <option value="comments-asc">コメント (少ない順)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearch} disabled={loading} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />
                    検索
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearSearch} disabled={loading}>
                      クリア
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <div className="bg-muted p-2 rounded-md mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium">{hasActiveFilters ? "フィルター適用中" : "全てのIssue"}</div>
                {appliedSearch && (
                  <Badge variant="secondary" className="text-xs">
                    キーワード: {appliedSearch}
                  </Badge>
                )}
                {appliedAuthor && (
                  <Badge variant="secondary" className="text-xs">
                    作成者: {appliedAuthor}
                  </Badge>
                )}
                {appliedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    ラベル: {label}
                  </Badge>
                ))}
                <div className="text-sm text-muted-foreground ml-auto">{loading ? "読み込み中..." : ""}</div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p>読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-1 border rounded-md overflow-hidden bg-card mb-4">
                  {issues.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      {hasActiveFilters ? "検索条件に一致するIssueはありません" : "Issueはありません"}
                    </div>
                  ) : (
                    issues.map((issue) => (
                      <div key={issue.id} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              {issue.state === "open" ? (
                                <Bug className="w-5 h-5 text-green-500" />
                              ) : (
                                <Bug className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium hover:text-primary">
                                <Link href={`/${owner}/${repo}/issues/${issue.number}`} className="hover:underline">
                                  {issue.title}
                                  <span className="text-muted-foreground ml-1">#{issue.number}</span>
                                </Link>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>
                                  <button
                                    onClick={() => handleUserClick(issue.user.login)}
                                    className="hover:underline hover:text-primary cursor-pointer font-medium"
                                    title={`${issue.user.login}で絞り込み`}
                                  >
                                    {issue.user.login}
                                  </button>
                                  が<RelativeTime dateString={issue.created_at} />
                                  に作成
                                </span>
                                {issue.comments > 0 && <span className="ml-2">コメント {issue.comments}件</span>}
                              </div>
                              {issue.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {issue.labels.map((label) => (
                                    <button
                                      key={label.id}
                                      onClick={() => handleLabelClick(label.name)}
                                      className="hover:opacity-80 transition-opacity"
                                      title={`「${label.name}」で絞り込み`}
                                    >
                                      <Badge
                                        style={{
                                          backgroundColor: `#${label.color}`,
                                          color: getContrastYIQ(label.color),
                                        }}
                                        className="text-xs cursor-pointer"
                                      >
                                        {label.name}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            更新: <RelativeTime dateString={issue.updated_at} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <SimplePagination
                  pagination={pagination}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  loading={loading}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
