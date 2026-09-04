import { Globe, GlobeLock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Lead } from "@/types/lead"

interface SiteStatusBadgeProps {
  siteStatus: Lead["site_status"]
  siteProblemas: string | null
}

export function SiteStatusBadge({ siteStatus, siteProblemas }: SiteStatusBadgeProps) {
  if (siteStatus === "site_ruim") {
    return (
      <Badge
        variant="outline"
        className="bg-warning/15 text-warning border-warning/30"
        title={siteProblemas ?? undefined}
      >
        <Globe className="size-3" />
        Web mala
      </Badge>
    )
  }
  if (siteStatus === "site_ok") {
    return (
      <Badge
        variant="outline"
        className="bg-success/15 text-success border-success/30"
        title="El reanálisis mostró que la web actual está técnicamente bien"
      >
        <Globe className="size-3" />
        Web ok
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      <GlobeLock className="size-3" />
      Sin web
    </Badge>
  )
}
