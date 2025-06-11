"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { useApiKey } from "./api-key-provider"
import { GitHubAPI } from "@/lib/github-api"
import { useToast } from "@/hooks/use-toast"

export function ApiKeySetup() {
  const [inputKey, setInputKey] = useState("")
  const [loading, setLoading] = useState(false)
  const { setApiKey } = useApiKey()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!inputKey.trim()) return

    setLoading(true)
    try {
      const api = new GitHubAPI(inputKey)
      await api.getUserRepositories() // APIキーの有効性をテスト
      setApiKey(inputKey)
      toast({
        title: "成功",
        description: "APIキーが正常に設定されました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "APIキーが無効です。正しいトークンを入力してください。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            GitHub API設定
          </CardTitle>
          <CardDescription>
            GitHub Personal Access Tokenを入力してください。
            <br />
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              トークンを作成する
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">GitHub Personal Access Token</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="github_pat_xxxxxxxxxxxx"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!inputKey.trim() || loading} className="w-full">
            {loading ? "確認中..." : "設定"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
