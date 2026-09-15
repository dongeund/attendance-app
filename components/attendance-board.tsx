"use client"

import { useMemo, useState } from "react"
import { CalendarPlus, Download, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useStore } from "@/components/data-store"
import { AttendanceDetailDialog, type CellTarget } from "@/components/attendance-detail-dialog"
import { BulkDayDialog } from "@/components/bulk-day-dialog"
import { StatusLegend, statusDot } from "@/components/status-badge"
import { downloadCsv } from "@/lib/export"
import {
  computeStudentStats,
  formatHours,
  formatMinutes,
  isDateInLeave,
  parseDate,
  rateTone,
  recordKey,
  WEEKDAY_KO,
} from "@/lib/attendance"
import { STATUS_META, STATUS_ORDER, type AttendanceStatus, type Course, type Student } from "@/lib/types"

type CellMode = "minutes" | "hours" | "status"

const LEFT_COLS = [
  { key: "no", label: "번호", width: 52 },
  { key: "name", label: "이름", width: 92 },
  { key: "eduId", label: "교육 ID", width: 136 },
  { key: "phone", label: "연락처", width: 128 },
  { key: "email", label: "이메일", width: 176 },
  { key: "total", label: "총 출석시간", width: 116 },
] as const

const LEFT_OFFSETS = LEFT_COLS.reduce<number[]>((acc, col, index) => {
  acc.push(index === 0 ? 0 : acc[index - 1] + LEFT_COLS[index - 1].width)
  return acc
}, [])

const DATE_COL_WIDTH = 62

export function AttendanceBoard({ course }: { course: Course }) {
  const { students, records, leaves, datesByCourse, excludeLeaveFromRate } = useStore()
  const dates = datesByCourse[course.id] ?? []

  const [query, setQuery] = useState("")
  const [studentFilter, setStudentFilter] = useState<"active" | "withdrawn" | "all">("active")
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all")
  const [lowOnly, setLowOnly] = useState(false)
  const [cellMode, setCellMode] = useState<CellMode>("minutes")
  const [target, setTarget] = useState<CellTarget | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const courseStudents = useMemo(
    () => students.filter((s) => s.courseId === course.id).sort((a, b) => a.no - b.no),
    [students, course.id],
  )

  const statsById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeStudentStats>>()
    for (const student of courseStudents) {
      map.set(
        student.id,
        computeStudentStats({ student, course, dates, records, leaves, excludeLeaveFromRate }),
      )
    }
    return map
  }, [courseStudents, course, dates, records, leaves, excludeLeaveFromRate])

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return courseStudents.filter((student) => {
      if (studentFilter !== "all" && student.status !== studentFilter) return false
      if (keyword) {
        const haystack = [student.name, student.eduId, student.phone, student.email].join(" ").toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      if (statusFilter !== "all") {
        const stats = statsById.get(student.id)
        if (!stats || stats.counts[statusFilter] === 0) return false
      }
      if (lowOnly) {
        const stats = statsById.get(student.id)
        if (!stats || stats.rate >= 80) return false
      }
      return true
    })
  }, [courseStudents, query, studentFilter, statusFilter, lowOnly, statsById])

  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number }[] = []
    for (const date of dates) {
      const label = `${Number(date.slice(5, 7))}월`
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.count += 1
      else groups.push({ label, count: 1 })
    }
    return groups
  }, [dates])

  const dailyPresent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const date of dates) {
      map[date] = courseStudents.filter((student) => {
        const record = records[recordKey(student.id, date)]
        return record && record.minutes > 0
      }).length
    }
    return map
  }, [dates, courseStudents, records])

  const handleExport = () => {
    const header = [
      "번호",
      "이름",
      "교육 ID",
      "연락처",
      "이메일",
      "상태",
      "총 출석시간(분)",
      "총 출석시간",
      "출석률(%)",
      ...dates,
    ]
    const body = rows.map((student) => {
      const stats = statsById.get(student.id)
      return [
        student.no,
        student.name,
        student.eduId,
        student.phone,
        student.email,
        student.status === "active" ? "정상" : "퇴소",
        stats?.totalMinutes ?? 0,
        formatMinutes(stats?.totalMinutes ?? 0),
        (stats?.rate ?? 0).toFixed(1),
        ...dates.map((date) => {
          const record = records[recordKey(student.id, date)]
          if (!record) return ""
          return `${record.minutes}(${STATUS_META[record.status].label})`
        }),
      ]
    })
    downloadCsv(`출석부_${course.name}_${course.cohort}`, [header, ...body])
  }

  const leftHeaderCell = (index: number) =>
    cn(
      "sticky z-30 border-b border-r bg-muted/70 px-2 py-2 text-xs font-semibold text-muted-foreground backdrop-blur",
      index === LEFT_COLS.length - 1 && "border-r-2 border-r-border",
    )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle className="text-lg">
                {course.name} <span className="text-primary">{course.cohort}</span>
              </CardTitle>
              <CardDescription>
                교육기간 {course.startDate} ~ {course.endDate} · 총 교육일 {dates.length}일 · 일일 교육시간{" "}
                {formatMinutes(course.dailyMinutes)} · 담당자 {course.manager}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <CalendarPlus data-icon="inline-start" />
                일일 출석 입력
              </Button>
              <Button onClick={handleExport}>
                <Download data-icon="inline-start" />
                엑셀 다운로드
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="board-search" className="text-xs text-muted-foreground">
                이름 / 교육 ID / 연락처 / 이메일
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="board-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="예: 김도윤 / CBD-2026-003 / 010-1234"
                  className="w-72 pl-8"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="board-student-status" className="text-xs text-muted-foreground">
                교육생 상태
              </Label>
              <Select value={studentFilter} onValueChange={(value) => setStudentFilter(value as typeof studentFilter)}>
                <SelectTrigger id="board-student-status" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">정상</SelectItem>
                    <SelectItem value="withdrawn">퇴소</SelectItem>
                    <SelectItem value="all">전체</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="board-att-status" className="text-xs text-muted-foreground">
                출석상태
              </Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger id="board-att-status" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">전체</SelectItem>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_META[status].label} 이력
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">셀 표시</span>
              <ToggleGroup
                value={[cellMode]}
                onValueChange={(value) => value[0] && setCellMode(value[0] as CellMode)}
                spacing={2}
              >
                <ToggleGroupItem value="minutes">분</ToggleGroupItem>
                <ToggleGroupItem value="hours">시간</ToggleGroupItem>
                <ToggleGroupItem value="status">상태</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button
              variant={lowOnly ? "default" : "outline"}
              onClick={() => setLowOnly((prev) => !prev)}
              className="ml-auto"
            >
              출석률 80% 미만만 보기
            </Button>

            {(query || statusFilter !== "all" || lowOnly || studentFilter !== "active") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("")
                  setStatusFilter("all")
                  setStudentFilter("active")
                  setLowOnly(false)
                }}
              >
                <X data-icon="inline-start" />
                초기화
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <StatusLegend />
            <span className="text-xs text-muted-foreground tabular-nums">
              {rows.length}명 표시 / 전체 {courseStudents.length}명
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden p-0">
        {rows.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>조건에 맞는 교육생이 없습니다</EmptyTitle>
              <EmptyDescription>검색어나 필터를 변경해 보세요.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="relative max-h-[calc(100vh-22rem)] min-h-[24rem] w-full overflow-auto">
            <table className="w-max border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {LEFT_COLS.map((col, index) => (
                    <th
                      key={col.key}
                      rowSpan={2}
                      scope="col"
                      style={{ left: LEFT_OFFSETS[index], width: col.width, minWidth: col.width }}
                      className={cn(leftHeaderCell(index), "top-0 h-[57px] text-left align-middle")}
                    >
                      {col.label}
                    </th>
                  ))}
                  {monthGroups.map((group, index) => (
                    <th
                      key={`${group.label}-${index}`}
                      colSpan={group.count}
                      scope="colgroup"
                      className="sticky top-0 z-20 h-7 border-b border-r bg-muted/70 px-2 text-xs font-semibold text-muted-foreground backdrop-blur"
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {dates.map((date) => {
                    const day = parseDate(date)
                    return (
                      <th
                        key={date}
                        scope="col"
                        style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                        className="sticky top-7 z-20 h-[30px] border-b border-r bg-muted/70 px-1 text-center text-xs font-medium backdrop-blur"
                      >
                        <span className="tabular-nums">{day.getDate()}</span>
                        <span className="ml-1 text-[11px] text-muted-foreground">{WEEKDAY_KO[day.getDay()]}</span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => {
                  const stats = statsById.get(student.id)
                  return (
                    <tr key={student.id} className="group">
                      <StudentCells student={student} totalMinutes={stats?.totalMinutes ?? 0} rate={stats?.rate ?? 0} />
                      {dates.map((date) => {
                        const record = records[recordKey(student.id, date)]
                        const leave = leaves.find(
                          (l) => l.studentId === student.id && l.approved && isDateInLeave(l, date),
                        )
                        const afterWithdrawn =
                          student.status === "withdrawn" && student.withdrawnAt ? date > student.withdrawnAt : false

                        return (
                          <td
                            key={date}
                            style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                            className={cn(
                              "border-b border-r p-0 text-center",
                              afterWithdrawn && "bg-muted/60",
                              !afterWithdrawn && "group-hover:bg-accent/40",
                            )}
                          >
                            {afterWithdrawn ? (
                              <span className="block py-2 text-xs text-muted-foreground">—</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setTarget({ student, date })}
                                title={
                                  record
                                    ? `${student.name} · ${date} · ${STATUS_META[record.status].label} ${record.minutes}분${
                                        record.note ? ` · ${record.note}` : ""
                                      }`
                                    : `${student.name} · ${date} · 미입력`
                                }
                                className={cn(
                                  "flex h-9 w-full cursor-pointer items-center justify-center gap-1 text-xs tabular-nums transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                  record ? STATUS_META[record.status].textToken : "text-muted-foreground/50",
                                  record && record.status !== "present" && STATUS_META[record.status].token,
                                )}
                              >
                                {record ? (
                                  <>
                                    <span className={cn("size-1.5 shrink-0 rounded-full", statusDot(record.status))} />
                                    {cellMode === "status"
                                      ? STATUS_META[record.status].short
                                      : cellMode === "hours"
                                        ? formatHours(record.minutes)
                                        : record.minutes}
                                  </>
                                ) : (
                                  "·"
                                )}
                                {leave ? <span className="sr-only">공가</span> : null}
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th
                    colSpan={LEFT_COLS.length}
                    scope="row"
                    style={{ left: 0 }}
                    className="sticky bottom-0 left-0 z-30 border-t-2 border-r-2 bg-card px-2 py-2 text-right text-xs font-semibold"
                  >
                    일자별 출석 인원 (전체 {courseStudents.length}명)
                  </th>
                  {dates.map((date) => (
                    <td
                      key={date}
                      className="sticky bottom-0 z-10 border-t-2 border-r bg-card px-1 py-2 text-center text-xs font-medium tabular-nums"
                    >
                      {dailyPresent[date] || <span className="text-muted-foreground/50">0</span>}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <AttendanceDetailDialog target={target} course={course} onClose={() => setTarget(null)} />
      {bulkOpen ? <BulkDayDialog course={course} onClose={() => setBulkOpen(false)} /> : null}
    </div>
  )
}

function StudentCells({
  student,
  totalMinutes,
  rate,
}: {
  student: Student
  totalMinutes: number
  rate: number
}) {
  const base = "sticky z-20 border-b border-r bg-card px-2 py-1.5 text-left align-middle group-hover:bg-accent/60"
  return (
    <>
      <th
        scope="row"
        style={{ left: LEFT_OFFSETS[0], width: LEFT_COLS[0].width, minWidth: LEFT_COLS[0].width }}
        className={cn(base, "text-center text-xs font-normal text-muted-foreground tabular-nums")}
      >
        {student.no}
      </th>
      <td
        style={{ left: LEFT_OFFSETS[1], width: LEFT_COLS[1].width, minWidth: LEFT_COLS[1].width }}
        className={cn(base, "font-medium")}
      >
        <span className="flex items-center gap-1.5">
          <span className="truncate">{student.name}</span>
          {student.status === "withdrawn" ? (
            <Badge variant="secondary" className="shrink-0 px-1 text-[10px]">
              퇴소
            </Badge>
          ) : null}
        </span>
      </td>
      <td
        style={{ left: LEFT_OFFSETS[2], width: LEFT_COLS[2].width, minWidth: LEFT_COLS[2].width }}
        className={cn(base, "text-xs text-muted-foreground tabular-nums")}
      >
        {student.eduId}
      </td>
      <td
        style={{ left: LEFT_OFFSETS[3], width: LEFT_COLS[3].width, minWidth: LEFT_COLS[3].width }}
        className={cn(base, "text-xs tabular-nums")}
      >
        {student.phone}
      </td>
      <td
        style={{ left: LEFT_OFFSETS[4], width: LEFT_COLS[4].width, minWidth: LEFT_COLS[4].width }}
        className={cn(base, "text-xs text-muted-foreground")}
      >
        <span className="block truncate">{student.email}</span>
      </td>
      <td
        style={{ left: LEFT_OFFSETS[5], width: LEFT_COLS[5].width, minWidth: LEFT_COLS[5].width }}
        className={cn(base, "border-r-2 border-r-border")}
      >
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-semibold tabular-nums">{formatMinutes(totalMinutes)}</span>
          <span className={cn("text-[11px] tabular-nums", rateTone(rate))}>{rate.toFixed(1)}%</span>
        </span>
      </td>
    </>
  )
}
