"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GitPullRequest, Bug, Search } from "lucide-react"
import { useApiKey } from "@/components/api-key-provider"
import { ApiKeySetup } from "@/components/api-key-setup"
import { GitHubAPI, type Repository, formatDate } from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function HomePage() {
  const { apiKey } = useApiKey()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (apiKey) {
      fetchRepositories()
    }
  }, [apiKey])

  useEffect(() => {
    const filtered = repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.description?.toLowerCase().includes(search.toLowerCase()) ||
        repo.owner.login.toLowerCase().includes(search.toLowerCase()),
    )
    setFilteredRepos(filtered)
  }, [repositories, search])

  const fetchRepositories = async () => {
    if (!apiKey) return

    setLoading(true)
    try {
      const api = new GitHubAPI(apiKey)
      const repos = await api.getUserRepositories()
      setRepositories(repos)
      toast({
        title: "成功",
        description: `${repos.length}個のリポジトリを取得しました`,
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "リポジトリの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!apiKey) {
    return <ApiKeySetup />
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GitHub リポジトリ閲覧ツール</h1>
        <p className="text-muted-foreground">GitHub APIキーを使ってリポジトリのIssueとプルリクエストを管理</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="リポジトリを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>リポジトリを取得中...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo) => (
            <Card key={repo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      <p>
                        {repo.name}
                      </p>
                    </CardTitle>
                    <CardDescription className="mt-1">{repo.description || "説明なし"}</CardDescription>
                  </div>
                  {repo.private && <Badge variant="secondary">プライベート</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={repo.owner.avatar_url || "/placeholder.svg"}
                    alt={repo.owner.login}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-muted-foreground">{repo.owner.login}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild className="flex-1">
                    <Link href={`/${repo.owner.login}/${repo.name}/issues`}>
                      <Bug className="w-4 h-4 mr-2" />
                      Issues
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/${repo.owner.login}/${repo.name}/pulls`}>
                      <GitPullRequest className="w-4 h-4 mr-2" />
                      PRs
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">更新: {formatDate(repo.updated_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredRepos.length === 0 && repositories.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">検索条件に一致するリポジトリはありません</p>
        </div>
      )}
    </div>
  )
}
