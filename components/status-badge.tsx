import { cn } from "@/lib/utils"
import { STATUS_META, type AttendanceStatus } from "@/lib/types"

export function StatusBadge({ status, className }: { status: AttendanceStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        meta.token,
        meta.textToken,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", statusDot(status))} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function statusDot(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "bg-present"
    case "late":
    case "early":
      return "bg-warn"
    case "absent":
      return "bg-danger"
    case "official":
    case "sick":
      return "bg-info"
    default:
      return "bg-muted-foreground"
  }
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      {(Object.keys(STATUS_META) as AttendanceStatus[]).map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-sm", statusDot(status))} aria-hidden="true" />
          {STATUS_META[status].label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-sm border border-dashed border-muted-foreground/60" aria-hidden="true" />
        미입력
      </span>
    </div>
  )
}
