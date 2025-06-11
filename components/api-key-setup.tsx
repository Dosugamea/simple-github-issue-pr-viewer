"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Shield, Eye, EyeOff, Info } from "lucide-react"
import { useApiKey } from "./api-key-provider"
import { GitHubAPI } from "@/lib/github-api"
import { validateApiKeyFormat, maskApiKey } from "@/lib/crypto-utils"
import { useToast } from "@/hooks/use-toast"

export function ApiKeySetup() {
  const [inputKey, setInputKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [validationError, setValidationError] = useState("")
  const { setApiKey, apiKey, clearApiKey } = useApiKey()
  const { toast } = useToast()

  const handleInputChange = (value: string) => {
    setInputKey(value)
    setValidationError("")

    if (value.trim() && !validateApiKeyFormat(value.trim())) {
      setValidationError("APIキーの形式が正しくありません")
    }
  }

  const handleSubmit = async () => {
    const trimmedKey = inputKey.trim()
    if (!trimmedKey) return

    if (!validateApiKeyFormat(trimmedKey)) {
      setValidationError("APIキーの形式が正しくありません")
      return
    }

    setLoading(true)
    try {
      const api = new GitHubAPI(trimmedKey)
      await api.getUserRepositories() // APIキーの有効性をテスト

      setApiKey(trimmedKey)
      toast({
        title: "成功",
        description: "APIキーが正常に設定され、暗号化して保存されました",
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

  const handleClearKey = () => {
    clearApiKey()
    setInputKey("")
    setValidationError("")
    toast({
      title: "APIキーを削除しました",
      description: "保存されたAPIキーが削除されました",
    })
  }

  // 既にAPIキーが設定されている場合の表示
  if (apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              APIキー設定済み
            </CardTitle>
            <CardDescription>GitHub APIキーが設定されています</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>現在のAPIキー</Label>
              <div className="p-2 bg-muted rounded-md font-mono text-sm">{maskApiKey(apiKey)}</div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>APIキーは暗号化されてローカルストレージに保存されています</AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearKey} className="flex-1">
                削除
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                続行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            GitHub Fine-grained personal access tokenを入力してください。
            <br />
            <a
              href="https://github.com/settings/personal-access-tokens"
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
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="github_pat_xxxxxxxxxxxx"
                value={inputKey}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={validationError ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {validationError && <p className="text-sm text-red-500">{validationError}</p>}
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              APIキーは暗号化されてローカルに保存されます。サーバーには送信されません。
            </AlertDescription>
          </Alert>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>必要な権限:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>repo (リポジトリアクセス)</li>
              <li>read:issues (Issue情報読み取り)</li>
              <li>read:pull-requests (PullRequest情報読み取り)</li>
            </ul>
          </div>

          <Button onClick={handleSubmit} disabled={!inputKey.trim() || loading || !!validationError} className="w-full">
            {loading ? "確認中..." : "設定"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
