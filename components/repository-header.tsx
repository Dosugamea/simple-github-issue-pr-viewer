"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Repository } from "@/lib/github-api"
import { useApiKey } from "./api-key-provider"
import { maskApiKey } from "@/lib/crypto-utils"
import Link from "next/link"

interface RepositoryHeaderProps {
  repository: Repository
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  const { clearApiKey, apiKey, isValidKey } = useApiKey()

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary hover:underline">
              ← ホーム
            </Link>
            <div className="flex items-center gap-2">
              <img
                src={repository.owner.avatar_url || "/placeholder.svg"}
                alt={repository.owner.login}
                className="w-6 h-6 rounded-full"
              />
              <p className="text-primary font-medium">{repository.owner.login}</p>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-xl font-bold">{repository.name}</h1>
              {repository.private && <Badge variant="secondary">プライベート</Badge>}
              <a
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:underline"
              >
                GitHubで表示
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValidKey && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3 text-green-500" />
                <span title={`APIキー: ${maskApiKey(apiKey || "")}`}>認証済み</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={clearApiKey}>
              <Settings className="w-4 h-4 mr-2" />
              API再設定
            </Button>
            <ThemeToggle />
          </div>
        </div>
        {repository.description && <p className="text-muted-foreground mt-2">{repository.description}</p>}
      </div>
    </div>
  )
}
