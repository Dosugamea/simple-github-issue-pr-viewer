"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { GitBranch } from "lucide-react"
import { useApiKey } from "@/components/api-key-provider"
import { ApiKeySetup } from "@/components/api-key-setup"
import { RepositoryHeader } from "@/components/repository-header"
import { TimelineItem } from "@/components/timeline-item"
import {
  GitHubAPI,
  type Repository,
  type PullRequest,
  type TimelineItem as TimelineItemType,
  formatDate,
  getContrastYIQ,
  getStateColor,
  getStateText,
} from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { RelativeTime } from "@/components/relative-time"

export default function PullRequestDetailPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const number = Number(params.number)
  const { apiKey } = useApiKey()
  const { toast } = useToast()

  const [repository, setRepository] = useState<Repository | null>(null)
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null)
  const [timeline, setTimeline] = useState<TimelineItemType[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (apiKey && owner && repo && number) {
      fetchData()
    }
  }, [apiKey, owner, repo, number])

  const fetchData = async () => {
    if (!apiKey) return

    setLoading(true)
    try {
      const api = new GitHubAPI(apiKey)
      const [repoData, prData, timelineData] = await Promise.all([
        api.getRepository(owner, repo),
        api.getPullRequest(owner, repo, number),
        api.getTimeline(owner, repo, number, true), // isPR = true
      ])

      setRepository(repoData)
      setPullRequest(prData)
      setTimeline(timelineData)
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

  if (!repository || !pullRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>プルリクエストが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <RepositoryHeader repository={repository} />

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link href={`/${owner}/${repo}/pulls`} className="text-primary hover:underline mb-4 inline-block">
            ← PR一覧に戻る
          </Link>
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStateColor(pullRequest.state)}>{getStateText(pullRequest.state)}</Badge>
              <h1 className="text-2xl font-bold">{pullRequest.title}</h1>
              <span className="text-sm text-muted-foreground">#{pullRequest.number}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <img
                  src={pullRequest.user.avatar_url || "/placeholder.svg"}
                  alt={pullRequest.user.login}
                  className="w-5 h-5 rounded-full mr-1"
                />
                <a
                  href={pullRequest.user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {pullRequest.user.login}
                </a>
              </div>
              <span>
                が<RelativeTime dateString={pullRequest.created_at} />
                に作成
              </span>
              {pullRequest.comments > 0 && <span>・コメント {pullRequest.comments}件</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            {/* PR本文 */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{pullRequest.body || "説明がありません"}</pre>
                </div>
              </CardContent>
            </Card>

            {/* タイムライン */}
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">タイムライン</h2>
              <Separator className="mb-6" />

              {timeline.length > 1 ? (
                <div>
                  {/* 最初のアイテム（PR自体）は表示しない */}
                  {timeline.slice(1).map((item) => (
                    <TimelineItem key={`${item.type}-${item.data.id}`} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">コメントやイベントはまだありません</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {pullRequest.assignees && pullRequest.assignees.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">担当者</h3>
                <div className="flex flex-wrap gap-2">
                  {pullRequest.assignees.map((assignee) => (
                    <div key={assignee.login} className="flex items-center gap-1">
                      <img
                        src={assignee.avatar_url || "/placeholder.svg"}
                        alt={assignee.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm">{assignee.login}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pullRequest.labels && pullRequest.labels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">ラベル</h3>
                <div className="flex flex-wrap gap-2">
                  {pullRequest.labels.map((label) => (
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
              </div>
            )}

            {pullRequest.head?.ref && pullRequest.base?.ref && (
              <div>
                <h3 className="text-sm font-medium mb-2">ブランチ情報</h3>
                <div className="text-sm border rounded-md p-2">
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-mono">{pullRequest.head.ref}</span>
                    <span className="mx-1">→</span>
                    <span className="font-mono">{pullRequest.base.ref}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">詳細情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">作成日時</span>
                  <span>{formatDate(pullRequest.created_at, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">更新日時</span>
                  <span>{formatDate(pullRequest.updated_at, true)}</span>
                </div>
              </div>
            </div>

            <div>
              <a
                href={pullRequest.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                GitHubで表示
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
