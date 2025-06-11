"use client"

import { Github, ExternalLink, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* 左側: 作者情報 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>by</span>
            <a
              href="https://github.com/Dosugamea"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Dosugamea
            </a>
          </div>

          {/* 中央: プロジェクト名（モバイルでは非表示） */}
          <div className="hidden md:block text-sm text-muted-foreground">GitHub Issue & PR Viewer</div>

          {/* 右側: リンク */}
          <div className="flex items-center gap-4">
            {/* ソースコードリンク */}
            <a
              href="https://github.com/Dosugamea/simple-github-issue-pr-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>Source Code</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {/* v0リンク */}
            <a
              href="https://v0.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Built with</span>
                <span className="font-semibold text-foreground">v0</span>
              </div>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* モバイル用の追加情報 */}
        <div className="mt-4 pt-4 border-t border-border/40 md:hidden">
          <div className="text-center text-xs text-muted-foreground">GitHub Issue & PR Viewer</div>
        </div>
      </div>
    </footer>
  )
}
