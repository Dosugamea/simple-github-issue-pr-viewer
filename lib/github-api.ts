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
  head?: {
    ref: string
    label?: string
    sha?: string
  }
  base?: {
    ref: string
    label?: string
    sha?: string
  }
  labels?: Array<{
    id: number
    name: string
    color: string
    description?: string
  }>
  comments: number
  assignees?: Array<{
    login: string
    avatar_url: string
    html_url: string
  }>
}

export interface Label {
  id: number
  name: string
  color: string
  description?: string
  default: boolean
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

export interface SearchResult<T> {
  total_count: number
  incomplete_results: boolean
  items: T[]
}

export interface SimplePaginationInfo {
  hasNext: boolean
  hasPrev: boolean
  currentPage: number
  nextUrl?: string
  prevUrl?: string
  totalCount?: number
  perPage?: number
}

export class GitHubAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(url: string): Promise<{ data: any; pagination?: SimplePaginationInfo }> {
    const response = await fetch(`https://api.github.com${url}`, {
      headers: {
        Authorization: `token ${this.apiKey}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const pagination = this.parseLinkHeader(response.headers.get("link"), url)

    return { data, pagination }
  }

  private parseLinkHeader(linkHeader: string | null, currentUrl: string): SimplePaginationInfo {
    const pagination: SimplePaginationInfo = {
      hasNext: false,
      hasPrev: false,
      currentPage: 1,
    }

    if (!linkHeader) {
      return pagination
    }

    // 現在のページ番号を取得
    const currentPageMatch = currentUrl.match(/[?&]page=(\d+)/)
    pagination.currentPage = currentPageMatch ? Number.parseInt(currentPageMatch[1]) : 1

    // Linkヘッダーをパース
    const links = linkHeader.split(",")
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
      if (match) {
        const [, url, rel] = match
        const cleanUrl = url.replace("https://api.github.com", "")

        switch (rel) {
          case "next":
            pagination.hasNext = true
            pagination.nextUrl = cleanUrl
            break
          case "prev":
            pagination.hasPrev = true
            pagination.prevUrl = cleanUrl
            break
        }
      }
    }

    return pagination
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const result = await this.request(`/repos/${owner}/${repo}`)
    return result.data
  }

  async getLabels(owner: string, repo: string): Promise<Label[]> {
    const result = await this.request(`/repos/${owner}/${repo}/labels?per_page=100`)
    return result.data
  }

  async getIssues(
    owner: string,
    repo: string,
    page = 1,
    perPage = 30,
  ): Promise<{ items: Issue[]; pagination: SimplePaginationInfo }> {
    const result = await this.request(`/repos/${owner}/${repo}/issues?state=all&per_page=${perPage}&page=${page}`)
    const issues = result.data.filter((issue: any) => !issue.pull_request)

    return {
      items: issues,
      pagination: result.pagination || { hasNext: false, hasPrev: false, currentPage: page },
    }
  }

  async getPullRequests(
    owner: string,
    repo: string,
    page = 1,
    perPage = 30,
  ): Promise<{ items: PullRequest[]; pagination: SimplePaginationInfo }> {
    const result = await this.request(`/repos/${owner}/${repo}/pulls?state=all&per_page=${perPage}&page=${page}`)

    return {
      items: result.data,
      pagination: result.pagination || { hasNext: false, hasPrev: false, currentPage: page },
    }
  }

  // searchIssuesメソッドを更新
  async searchIssues(
    owner: string,
    repo: string,
    query: string,
    page = 1,
    perPage = 30,
    sort: "created" | "updated" | "comments" = "created",
    order: "asc" | "desc" = "desc",
  ): Promise<{ items: Issue[]; pagination: SimplePaginationInfo }> {
    // クエリが空の場合でも、repo:owner/repo type:issueを使用
    const baseQuery = `repo:${owner}/${repo} type:issue`
    const searchQuery = query.trim() ? `${baseQuery} ${query}` : baseQuery
    const url = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page}`

    const result = await this.request(url)
    const response: SearchResult<Issue> = result.data

    // 検索APIの場合は総数がわかるので、より正確なページネーション情報を作成
    const totalPages = Math.ceil(response.total_count / perPage)
    const pagination: SimplePaginationInfo = {
      hasNext: page < totalPages,
      hasPrev: page > 1,
      currentPage: page,
      totalCount: response.total_count,
      perPage: perPage,
    }

    if (pagination.hasNext) {
      pagination.nextUrl = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page + 1}`
    }
    if (pagination.hasPrev) {
      pagination.prevUrl = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page - 1}`
    }

    return { items: response.items, pagination }
  }

  // searchPullRequestsメソッドも同様に更新
  async searchPullRequests(
    owner: string,
    repo: string,
    query: string,
    page = 1,
    perPage = 30,
    sort: "created" | "updated" | "comments" = "created",
    order: "asc" | "desc" = "desc",
  ): Promise<{ items: PullRequest[]; pagination: SimplePaginationInfo }> {
    // クエリが空の場合でも、repo:owner/repo type:prを使用
    const baseQuery = `repo:${owner}/${repo} type:pr`
    const searchQuery = query.trim() ? `${baseQuery} ${query}` : baseQuery
    const url = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page}`

    const result = await this.request(url)
    const response: SearchResult<PullRequest> = result.data

    const totalPages = Math.ceil(response.total_count / perPage)
    const pagination: SimplePaginationInfo = {
      hasNext: page < totalPages,
      hasPrev: page > 1,
      currentPage: page,
      totalCount: response.total_count,
      perPage: perPage,
    }

    if (pagination.hasNext) {
      pagination.nextUrl = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page + 1}`
    }
    if (pagination.hasPrev) {
      pagination.prevUrl = `/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page - 1}`
    }

    return { items: response.items, pagination }
  }

  // URLから直接データを取得するメソッド（ページネーション用）
  async requestByUrl(url: string): Promise<{ data: any; pagination?: SimplePaginationInfo }> {
    return this.request(url)
  }

  async getIssue(owner: string, repo: string, number: number): Promise<Issue> {
    const result = await this.request(`/repos/${owner}/${repo}/issues/${number}`)
    return result.data
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<PullRequest> {
    const result = await this.request(`/repos/${owner}/${repo}/pulls/${number}`)
    return result.data
  }

  async getUserRepositories(): Promise<Repository[]> {
    const result = await this.request("/user/repos?per_page=100")
    return result.data
  }

  async getIssueComments(owner: string, repo: string, number: number): Promise<Comment[]> {
    const result = await this.request(`/repos/${owner}/${repo}/issues/${number}/comments`)
    return result.data
  }

  async getIssueEvents(owner: string, repo: string, number: number): Promise<Event[]> {
    const result = await this.request(`/repos/${owner}/${repo}/issues/${number}/events`)
    return result.data
  }

  async getTimeline(owner: string, repo: string, number: number, isPR = false): Promise<TimelineItem[]> {
    try {
      const [item, comments, events] = await Promise.all([
        isPR ? this.getPullRequest(owner, repo, number) : this.getIssue(owner, repo, number),
        this.getIssueComments(owner, repo, number),
        this.getIssueEvents(owner, repo, number),
      ])

      const filteredEvents = isPR ? events.filter((event) => event.event !== "closed") : events

      const timeline: TimelineItem[] = [
        {
          type: isPR ? "issue" : "issue",
          data: item,
          created_at: item.created_at,
        },
        ...comments.map((comment) => ({
          type: "comment" as const,
          data: comment,
          created_at: comment.created_at,
        })),
        ...filteredEvents
          .filter((event) => event && event.created_at)
          .map((event) => ({
            type: "event" as const,
            data: event,
            created_at: event.created_at,
          })),
      ]

      return timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } catch (error) {
      console.error("Timeline取得エラー:", error)
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
