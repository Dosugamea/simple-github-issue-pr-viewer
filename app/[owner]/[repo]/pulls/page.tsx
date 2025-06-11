"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GitPullRequest, GitBranch, Search } from "lucide-react"
import { useApiKey } from "@/components/api-key-provider"
import { ApiKeySetup } from "@/components/api-key-setup"
import { RepositoryHeader } from "@/components/repository-header"
import { GitHubAPI, type Repository, type PullRequest, getContrastYIQ } from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { RelativeTime } from "@/components/relative-time"

export default function PullRequestsPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const { apiKey } = useApiKey()
  const { toast } = useToast()

  const [repository, setRepository] = useState<Repository | null>(null)
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"created" | "updated" | "comments">("created")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [availableLabels, setAvailableLabels] = useState<{ id: number; name: string; color: string }[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<{ login: string; avatar_url: string }[]>([])

  useEffect(() => {
    if (apiKey && owner && repo) {
      fetchData()
    }
  }, [apiKey, owner, repo])

  const fetchData = async () => {
    if (!apiKey) return

    setLoading(true)
    try {
      const api = new GitHubAPI(apiKey)
      const [repoData, prsData] = await Promise.all([api.getRepository(owner, repo), api.getPullRequests(owner, repo)])

      setRepository(repoData)
      setPullRequests(prsData)

      // ラベルと作成者を抽出
      const labels = new Map()
      const authors = new Map()

      prsData.forEach((pr) => {
        if (pr.labels) {
          pr.labels.forEach((label) => {
            if (!labels.has(label.name)) {
              labels.set(label.name, { id: label.id, name: label.name, color: label.color })
            }
          })
        }

        if (!authors.has(pr.user.login)) {
          authors.set(pr.user.login, { login: pr.user.login, avatar_url: pr.user.avatar_url })
        }
      })

      setAvailableLabels(Array.from(labels.values()))
      setAvailableAuthors(Array.from(authors.values()))
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPRs = pullRequests
    .filter((pr) => {
      const textMatch =
        pr.title.toLowerCase().includes(search.toLowerCase()) || pr.body?.toLowerCase().includes(search.toLowerCase())

      const labelMatch =
        selectedLabels.length === 0 || (pr.labels && pr.labels.some((label) => selectedLabels.includes(label.name)))

      const authorMatch = selectedAuthors.length === 0 || selectedAuthors.includes(pr.user.login)

      return textMatch && labelMatch && authorMatch
    })
    .sort((a, b) => {
      let valueA, valueB

      if (sortBy === "created") {
        valueA = new Date(a.created_at).getTime()
        valueB = new Date(b.created_at).getTime()
      } else if (sortBy === "updated") {
        valueA = new Date(a.updated_at).getTime()
        valueB = new Date(b.updated_at).getTime()
      } else if (sortBy === "comments") {
        valueA = a.comments
        valueB = b.comments
      } else {
        return 0
      }

      return sortDirection === "asc" ? valueA - valueB : valueB - valueA
    })

  if (!apiKey) {
    return <ApiKeySetup />
  }

  if (loading && !repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>リポジトリが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RepositoryHeader repository={repository} />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/${owner}/${repo}/issues`} className="text-muted-foreground hover:text-primary">
              Issues
            </Link>
            <h2 className="text-2xl font-semibold">Pull requests</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* サイドバー：フィルターとソート */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">フィルター</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pr-search" className="mb-1 block">
                    キーワード検索
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pr-search"
                      placeholder="タイトル、説明で検索..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {availableLabels.length > 0 && (
                  <div>
                    <Label className="mb-1 block">ラベル</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableLabels.map((label) => (
                        <div key={label.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`pr-label-${label.id}`}
                            checked={selectedLabels.includes(label.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLabels([...selectedLabels, label.name])
                              } else {
                                setSelectedLabels(selectedLabels.filter((l) => l !== label.name))
                              }
                            }}
                            className="mr-2"
                          />
                          <label htmlFor={`pr-label-${label.id}`} className="flex items-center cursor-pointer">
                            <span
                              className="w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: `#${label.color}` }}
                            ></span>
                            <span className="text-sm">{label.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableAuthors.length > 0 && (
                  <div>
                    <Label className="mb-1 block">作成者</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableAuthors.map((author) => (
                        <div key={author.login} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`pr-author-${author.login}`}
                            checked={selectedAuthors.includes(author.login)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAuthors([...selectedAuthors, author.login])
                              } else {
                                setSelectedAuthors(selectedAuthors.filter((a) => a !== author.login))
                              }
                            }}
                            className="mr-2"
                          />
                          <label htmlFor={`pr-author-${author.login}`} className="flex items-center cursor-pointer">
                            <img
                              src={author.avatar_url || "/placeholder.svg"}
                              alt={author.login}
                              className="w-4 h-4 rounded-full mr-1"
                            />
                            <span className="text-sm">{author.login}</span>
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
                  >
                    <option value="created-desc">作成日 (新しい順)</option>
                    <option value="created-asc">作成日 (古い順)</option>
                    <option value="updated-desc">更新日 (新しい順)</option>
                    <option value="updated-asc">更新日 (古い順)</option>
                    <option value="comments-desc">コメント (多い順)</option>
                    <option value="comments-asc">コメント (少ない順)</option>
                  </select>
                </div>

                {(selectedLabels.length > 0 || selectedAuthors.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedLabels([])
                      setSelectedAuthors([])
                    }}
                    className="w-full"
                  >
                    フィルターをクリア
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ：PR一覧 */}
          <div className="md:col-span-3">
            <div className="bg-muted p-2 rounded-md mb-4 flex justify-between items-center">
              <div className="text-sm">{filteredPRs.length} 件のプルリクエスト</div>
              <div className="text-sm">
                {selectedLabels.length > 0 && (
                  <span className="mr-2">{selectedLabels.length}個のラベルでフィルター中</span>
                )}
                {selectedAuthors.length > 0 && <span>{selectedAuthors.length}人の作成者でフィルター中</span>}
              </div>
            </div>

            <div className="space-y-1 border rounded-md overflow-hidden bg-white">
              {filteredPRs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">条件に一致するプルリクエストはありません</div>
              ) : (
                filteredPRs.map((pr) => (
                  <Link
                    key={pr.id}
                    href={`/${owner}/${repo}/pulls/${pr.number}`}
                    className="block p-3 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {pr.state === "open" ? (
                            <GitPullRequest className="w-5 h-5 text-green-500" />
                          ) : pr.state === "closed" ? (
                            <GitPullRequest className="w-5 h-5 text-red-500" />
                          ) : (
                            <GitPullRequest className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium hover:text-primary">
                            {pr.title}
                            <span className="text-muted-foreground ml-1">#{pr.number}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>
                              {pr.user.login}が<RelativeTime dateString={pr.created_at} />
                              に作成
                            </span>
                            {pr.comments > 0 && <span className="ml-2">コメント {pr.comments}件</span>}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <GitBranch className="w-3 h-3" />
                            <span className="font-mono">
                              {pr.head.ref} → {pr.base.ref}
                            </span>
                          </div>
                          {pr.labels && pr.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pr.labels.map((label) => (
                                <Badge
                                  key={label.id}
                                  style={{
                                    backgroundColor: `#${label.color}`,
                                    color: getContrastYIQ(label.color),
                                  }}
                                  className="text-xs"
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        更新: <RelativeTime dateString={pr.updated_at} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
