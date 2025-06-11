"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RelativeTime } from "@/components/relative-time"
import {
  XCircle,
  RefreshCw,
  Tag,
  TagIcon as TagOff,
  UserPlus,
  UserMinus,
  Milestone,
  Edit,
  Lock,
  Unlock,
  GitMerge,
  Circle,
} from "lucide-react"
import {
  type TimelineItem as TimelineItemType,
  type Comment,
  type Event,
  getEventDescription,
  getEventIcon,
  getEventColor,
} from "@/lib/github-api"

interface TimelineItemProps {
  item: TimelineItemType
}

export function TimelineItem({ item }: TimelineItemProps) {
  if (item.type === "comment") {
    const comment = item.data as Comment
    return (
      <div className="flex gap-4 mb-6">
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={comment.user.avatar_url || "/placeholder.svg"} alt={comment.user.login} />
            <AvatarFallback>{comment.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow">
          <Card>
            <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center gap-2">
              <a
                href={comment.user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {comment.user.login}
              </a>
              <span className="text-sm text-muted-foreground">
                <RelativeTime dateString={comment.created_at} />
                にコメント
              </span>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans">{comment.body}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } else if (item.type === "event") {
    const event = item.data as Event
    const IconComponent = getIconComponent(getEventIcon(event.event))

    // actorがnullの場合のデフォルト値を設定
    const actor = event.actor || {
      login: "システム",
      avatar_url: "",
      html_url: "#",
    }

    return (
      <div className="flex items-center gap-2 py-2 mb-2 text-sm">
        <div className="flex-shrink-0">
          <Avatar className="w-6 h-6">
            <AvatarImage src={actor.avatar_url || "/placeholder.svg"} alt={actor.login} />
            <AvatarFallback>
              {actor.login === "システム" ? "SYS" : actor.login.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-1">
          <IconComponent className={`w-4 h-4 ${getEventColor(event.event)}`} />
          <span>{getEventDescription(event)}</span>
          <span className="text-muted-foreground">
            <RelativeTime dateString={event.created_at} />
          </span>
        </div>
      </div>
    )
  }

  return null
}

function getIconComponent(iconName: string) {
  switch (iconName) {
    case "x-circle":
      return XCircle
    case "refresh-cw":
      return RefreshCw
    case "tag":
      return Tag
    case "tag-off":
      return TagOff
    case "user-plus":
      return UserPlus
    case "user-minus":
      return UserMinus
    case "milestone":
      return Milestone
    case "edit":
      return Edit
    case "lock":
      return Lock
    case "unlock":
      return Unlock
    case "git-merge":
      return GitMerge
    default:
      return Circle
  }
}
