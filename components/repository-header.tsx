"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Repository } from "@/lib/github-api"
import { useApiKey } from "./api-key-provider"
import Link from "next/link"

interface RepositoryHeaderProps {
  repository: Repository
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  const { clearApiKey } = useApiKey()

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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              GitHubで表示
            </a>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={clearApiKey}>
              <Settings className="w-4 h-4 mr-2" />
              API設定
            </Button>
          </div>
        </div>
        {repository.description && <p className="text-muted-foreground mt-2">{repository.description}</p>}
      </div>
    </div>
  )
}
