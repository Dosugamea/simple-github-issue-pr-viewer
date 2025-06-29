"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useApiKey } from "@/components/api-key-provider"
import { ApiKeySetup } from "@/components/api-key-setup"
import { RepositoryHeader } from "@/components/repository-header"
import { TimelineItem } from "@/components/timeline-item"
import {
  GitHubAPI,
  type Repository,
  type Issue,
  type TimelineItem as TimelineItemType,
  formatDate,
  getContrastYIQ,
  getStateColor,
  getStateText,
} from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { RelativeTime } from "@/components/relative-time"

export default function IssueDetailPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const number = Number(params.number)
  const { apiKey } = useApiKey()
  const { toast } = useToast()

  const [repository, setRepository] = useState<Repository | null>(null)
  const [issue, setIssue] = useState<Issue | null>(null)
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
      const [repoData, issueData, timelineData] = await Promise.all([
        api.getRepository(owner, repo),
        api.getIssue(owner, repo, number),
        api.getTimeline(owner, repo, number),
      ])

      setRepository(repoData)
      setIssue(issueData)
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

  if (!repository || !issue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Issue が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <RepositoryHeader repository={repository} />

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link href={`/${owner}/${repo}/issues`} className="text-primary hover:underline mb-4 inline-block">
            ← Issue一覧に戻る
          </Link>
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStateColor(issue.state)}>{getStateText(issue.state)}</Badge>
              <h1 className="text-2xl font-bold">{issue.title}</h1>
              <span className="text-sm text-muted-foreground">#{issue.number}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <img
                  src={issue.user.avatar_url || "/placeholder.svg"}
                  alt={issue.user.login}
                  className="w-5 h-5 rounded-full mr-1"
                />
                <a href={issue.user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {issue.user.login}
                </a>
              </div>
              <span>
                が<RelativeTime dateString={issue.created_at} />
                に作成
              </span>
              {issue.comments > 0 && <span>・コメント {issue.comments}件</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            {/* Issue本文 */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{issue.body || "説明がありません"}</pre>
                </div>
              </CardContent>
            </Card>

            {/* タイムライン */}
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">タイムライン</h2>
              <Separator className="mb-6" />

              {timeline.length > 1 ? (
                <div>
                  {/* 最初のアイテム（Issue自体）は表示しない */}
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
            {issue.assignees && issue.assignees.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">担当者</h3>
                <div className="flex flex-wrap gap-2">
                  {issue.assignees.map((assignee) => (
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

            {issue.labels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">ラベル</h3>
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label) => (
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

            <div>
              <h3 className="text-sm font-medium mb-2">詳細情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">作成日時</span>
                  <span>{formatDate(issue.created_at, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">更新日時</span>
                  <span>{formatDate(issue.updated_at, true)}</span>
                </div>
              </div>
            </div>

            <div>
              <a
                href={issue.html_url}
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
