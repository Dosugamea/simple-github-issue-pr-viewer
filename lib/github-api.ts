export interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  html_url: string
  updated_at: string
}

export interface Issue {
  id: number
  number: number
  title: string
  body: string
  state: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
  labels: Array<{
    id: number
    name: string
    color: string
    description?: string
  }>
  comments: number
  assignees: Array<{
    login: string
    avatar_url: string
    html_url: string
  }>
}

export interface PullRequest {
  id: number
  number: number
  title: string
  body: string
  state: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
  head: {
    ref: string
  }
  base: {
    ref: string
  }
  labels: Array<{
    id: number
    name: string
    color: string
    description?: string
  }>
  comments: number
  assignees: Array<{
    login: string
    avatar_url: string
    html_url: string
  }>
}

export interface Comment {
  id: number
  body: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

export interface Event {
  id: string
  event: string
  actor: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  commit_id?: string
  commit_url?: string
  created_at: string
  state?: string
  label?: {
    name: string
    color: string
  }
  assignee?: {
    login: string
    avatar_url: string
  }
}

export interface TimelineItem {
  type: "issue" | "comment" | "event"
  data: Issue | Comment | Event
  created_at: string
}

export class GitHubAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(url: string) {
    const response = await fetch(`https://api.github.com${url}`, {
      headers: {
        Authorization: `token ${this.apiKey}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    return this.request(`/repos/${owner}/${repo}`)
  }

  async getIssues(owner: string, repo: string): Promise<Issue[]> {
    const issues = await this.request(`/repos/${owner}/${repo}/issues?state=all&per_page=100`)
    return issues.filter((issue: any) => !issue.pull_request)
  }

  async getIssue(owner: string, repo: string, number: number): Promise<Issue> {
    return this.request(`/repos/${owner}/${repo}/issues/${number}`)
  }

  async getPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
    return this.request(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`)
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<PullRequest> {
    return this.request(`/repos/${owner}/${repo}/pulls/${number}`)
  }

  async getUserRepositories(): Promise<Repository[]> {
    return this.request("/user/repos?per_page=100")
  }

  // 新しく追加するメソッド
  async getIssueComments(owner: string, repo: string, number: number): Promise<Comment[]> {
    return this.request(`/repos/${owner}/${repo}/issues/${number}/comments`)
  }

  async getIssueEvents(owner: string, repo: string, number: number): Promise<Event[]> {
    return this.request(`/repos/${owner}/${repo}/issues/${number}/events`)
  }

  // Issue/PRのタイムラインを取得（コメントとイベントを時系列で結合）
  async getTimeline(owner: string, repo: string, number: number, isPR = false): Promise<TimelineItem[]> {
    try {
      // Issue/PRの詳細、コメント、イベントを並行して取得
      const [item, comments, events] = await Promise.all([
        isPR ? this.getPullRequest(owner, repo, number) : this.getIssue(owner, repo, number),
        this.getIssueComments(owner, repo, number),
        this.getIssueEvents(owner, repo, number),
      ])

      // タイムラインアイテムを作成
      const timeline: TimelineItem[] = [
        // Issue/PR自体を最初のアイテムとして追加
        {
          type: isPR ? "issue" : "issue",
          data: item,
          created_at: item.created_at,
        },
        // コメントをタイムラインアイテムに変換
        ...comments.map((comment) => ({
          type: "comment" as const,
          data: comment,
          created_at: comment.created_at,
        })),
        // イベントをタイムラインアイテムに変換（nullチェックを追加）
        ...events
          .filter((event) => event && event.created_at) // nullや不正なイベントを除外
          .map((event) => ({
            type: "event" as const,
            data: event,
            created_at: event.created_at,
          })),
      ]

      // 作成日時でソート
      return timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } catch (error) {
      console.error("Timeline取得エラー:", error)
      // エラーが発生した場合は、最低限Issue/PRの情報だけ返す
      const item = isPR ? await this.getPullRequest(owner, repo, number) : await this.getIssue(owner, repo, number)
      return [
        {
          type: isPR ? "issue" : "issue",
          data: item,
          created_at: item.created_at,
        },
      ]
    }
  }
}

export function getContrastYIQ(hexcolor: string) {
  const r = Number.parseInt(hexcolor.substring(0, 2), 16)
  const g = Number.parseInt(hexcolor.substring(2, 4), 16)
  const b = Number.parseInt(hexcolor.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#000000" : "#ffffff"
}

export function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}時間前`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}日前`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}

export function formatDate(dateString: string, includeTime = false) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }
  return new Date(dateString).toLocaleDateString("ja-JP", options)
}

export function formatExactDateTime(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function getStateColor(state: string) {
  switch (state) {
    case "open":
      return "bg-green-100 text-green-800"
    case "closed":
      return "bg-red-100 text-red-800"
    case "merged":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getStateText(state: string) {
  switch (state) {
    case "open":
      return "Open"
    case "closed":
      return "Closed"
    case "merged":
      return "Merged"
    default:
      return state
  }
}

export function getEventIcon(event: string) {
  switch (event) {
    case "closed":
      return "x-circle"
    case "reopened":
      return "refresh-cw"
    case "labeled":
      return "tag"
    case "unlabeled":
      return "tag-off"
    case "assigned":
      return "user-plus"
    case "unassigned":
      return "user-minus"
    case "milestoned":
      return "milestone"
    case "demilestoned":
      return "milestone-off"
    case "renamed":
      return "edit"
    case "locked":
      return "lock"
    case "unlocked":
      return "unlock"
    case "merged":
      return "git-merge"
    default:
      return "circle"
  }
}

export function getEventColor(event: string) {
  switch (event) {
    case "closed":
      return "text-red-500"
    case "reopened":
      return "text-green-500"
    case "labeled":
      return "text-blue-500"
    case "unlabeled":
      return "text-gray-500"
    case "assigned":
      return "text-purple-500"
    case "unassigned":
      return "text-gray-500"
    case "milestoned":
      return "text-yellow-500"
    case "demilestoned":
      return "text-gray-500"
    case "renamed":
      return "text-blue-500"
    case "locked":
      return "text-orange-500"
    case "unlocked":
      return "text-green-500"
    case "merged":
      return "text-purple-500"
    default:
      return "text-gray-500"
  }
}

export function getEventDescription(event: Event) {
  const actorName = event.actor?.login || "システム"

  switch (event.event) {
    case "closed":
      return `${actorName}がこのIssueをクローズしました`
    case "reopened":
      return `${actorName}がこのIssueを再オープンしました`
    case "labeled":
      return `${actorName}が "${event.label?.name}" ラベルを追加しました`
    case "unlabeled":
      return `${actorName}が "${event.label?.name}" ラベルを削除しました`
    case "assigned":
      return `${actorName}が ${event.assignee?.login || ""} をアサインしました`
    case "unassigned":
      return `${actorName}が ${event.assignee?.login || ""} のアサインを解除しました`
    case "milestoned":
      return `${actorName}がマイルストーンを設定しました`
    case "demilestoned":
      return `${actorName}がマイルストーンを解除しました`
    case "renamed":
      return `${actorName}がタイトルを変更しました`
    case "locked":
      return `${actorName}がこの会話をロックしました`
    case "unlocked":
      return `${actorName}がこの会話のロックを解除しました`
    case "merged":
      return `${actorName}がこのプルリクエストをマージしました`
    default:
      return `${actorName}が ${event.event} アクションを実行しました`
  }
}
