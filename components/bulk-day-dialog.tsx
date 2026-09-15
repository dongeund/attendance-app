"use client"

import { useMemo, useState } from "react"
import { CheckCheck } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/components/data-store"
import { defaultRecordForStatus, formatMinutes, isDateInLeave, recordKey, WEEKDAY_KO, parseDate } from "@/lib/attendance"
import { STATUS_META, STATUS_ORDER, type AttendanceRecord, type AttendanceStatus, type Course } from "@/lib/types"

export function BulkDayDialog({ course, onClose }: { course: Course; onClose: () => void }) {
  const { students, records, leaves, datesByCourse, bulkSaveRecords } = useStore()
  const dates = datesByCourse[course.id] ?? []
  const today = "2026-07-27"
  const initialDate = dates.find((d) => d >= today) ?? dates[dates.length - 1]

  const [date, setDate] = useState(initialDate)
  const roster = useMemo(
    () =>
      students
        .filter((s) => s.courseId === course.id && s.status === "active")
        .sort((a, b) => a.no - b.no),
    [students, course.id],
  )

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>(() => seed(roster.map((s) => s.id)))

  function seed(ids: string[]) {
    const out: Record<string, AttendanceStatus> = {}
    for (const id of ids) out[id] = records[recordKey(id, initialDate)]?.status ?? "present"
    return out
  }

  const changeDate = (next: string) => {
    setDate(next)
    const out: Record<string, AttendanceStatus> = {}
    for (const student of roster) {
      const onLeave = leaves.some((l) => l.studentId === student.id && l.approved && isDateInLeave(l, next))
      out[student.id] = records[recordKey(student.id, next)]?.status ?? (onLeave ? "official" : "present")
    }
    setDraft(out)
  }

  const handleSave = () => {
    const list: AttendanceRecord[] = roster.map((student) => {
      const status = draft[student.id] ?? "present"
      const base = defaultRecordForStatus(status, course)
      const previous = records[recordKey(student.id, date)]
      return {
        studentId: student.id,
        date,
        status,
        checkIn: base.checkIn,
        checkOut: base.checkOut,
        minutes: base.minutes,
        note: previous?.note ?? "",
      }
    })
    bulkSaveRecords(list)
    toast.success(`${date} 출석 ${list.length}건을 저장했습니다.`)
    onClose()
  }

  const summary = STATUS_ORDER.map((status) => ({
    status,
    count: Object.values(draft).filter((value) => value === status).length,
  })).filter((item) => item.count > 0)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>일일 출석 입력</DialogTitle>
          <DialogDescription>
            하루 단위로 전체 교육생의 출석상태를 입력합니다. 기본 입·퇴실 시간과 교육시간(
            {formatMinutes(course.dailyMinutes)} 기준)이 자동 적용됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field className="w-56">
            <FieldLabel htmlFor="bulk-date">교육일자</FieldLabel>
            <Select value={date} onValueChange={(value) => changeDate(value as string)}>
              <SelectTrigger id="bulk-date" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  {dates.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item} ({WEEKDAY_KO[parseDate(item).getDay()]})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button
            variant="outline"
            onClick={() => setDraft(Object.fromEntries(roster.map((s) => [s.id, "present" as AttendanceStatus])))}
          >
            <CheckCheck data-icon="inline-start" />
            전체 출석 처리
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border">
          <ul className="divide-y">
            {roster.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {student.no}. {student.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">{student.eduId}</p>
                </div>
                <Select
                  value={draft[student.id] ?? "present"}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, [student.id]: value as AttendanceStatus }))}
                >
                  <SelectTrigger size="sm" className="w-28" aria-label={`${student.name} 출석상태`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_ORDER.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_META[status].label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          {summary.map((item) => `${STATUS_META[item.status].label} ${item.count}명`).join(" · ")}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>{date} 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
