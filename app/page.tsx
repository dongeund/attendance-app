"use client"

import Link from "next/link"
import { AlertTriangle, ArrowUpRight, FileWarning, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { PageHeader } from "@/components/page-header"
import { SummaryCards, useCourseSummary } from "@/components/summary-cards"
import { StatusBadge } from "@/components/status-badge"
import { useActiveCourse, useStore } from "@/components/data-store"
import { cn } from "@/lib/utils"
import { formatMinutes, rateTone } from "@/lib/attendance"

export default function DashboardPage() {
  const course = useActiveCourse()
  const { students, leaves, excludeLeaveFromRate } = useStore()
  const summary = useCourseSummary(course)

  const courseStudentIds = new Set(summary.courseStudents.map((s) => s.id))
  const courseLeaves = leaves.filter((l) => courseStudentIds.has(l.studentId))
  const pendingProject = summary.active.filter((s) => s.projectReturn === "pending")
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? id

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="대시보드"
        description={`${course.name} ${course.cohort} · ${course.startDate} ~ ${course.endDate} · 일일 교육시간 ${formatMinutes(
          course.dailyMinutes,
        )}`}
        actions={
          <Button render={<Link href="/attendance" />} nativeButton={false}>
            출석부 열기
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        }
      />

      <SummaryCards course={course} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warn" aria-hidden="true" />
              관리 필요 교육생
            </CardTitle>
            <CardDescription>
              출석률 80% 미만 교육생입니다. {excludeLeaveFromRate ? "승인된 공가일은 계산에서 제외했습니다." : "공가일도 계산에 포함했습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {summary.lowAttendance.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyTitle>관리 대상 교육생이 없습니다</EmptyTitle>
                  <EmptyDescription>모든 교육생이 출석률 80% 이상을 유지하고 있습니다.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>교육 ID</TableHead>
                    <TableHead className="text-right">총 출석시간</TableHead>
                    <TableHead className="text-right">결석/지각</TableHead>
                    <TableHead className="w-40">출석률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.lowAttendance.slice(0, 8).map(({ student, stats }) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{student.eduId}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMinutes(stats.totalMinutes)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="text-danger">{stats.counts.absent}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-warn">{stats.counts.late}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.rate} className="flex-1" aria-label={`${student.name} 출석률`} />
                          <span className={cn("w-12 text-right text-xs tabular-nums", rateTone(stats.rate))}>
                            {stats.rate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-info" aria-hidden="true" />
                공가 현황
              </CardTitle>
              <CardDescription>승인 대기 {courseLeaves.filter((l) => !l.approved).length}건</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {courseLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 공가가 없습니다.</p>
              ) : (
                courseLeaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {nameOf(leave.studentId)}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                          {leave.startDate === leave.endDate
                            ? leave.startDate
                            : `${leave.startDate} ~ ${leave.endDate}`}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{leave.reason}</p>
                    </div>
                    <Badge variant={leave.approved ? "secondary" : "outline"} className="shrink-0">
                      {leave.approved ? "승인" : "대기"}
                    </Badge>
                  </div>
                ))
              )}
              <Separator />
              <Button variant="outline" render={<Link href="/leaves" />} nativeButton={false}>
                공가 관리로 이동
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileWarning className="size-4 text-warn" aria-hidden="true" />
                프로젝트 자료 미회신
              </CardTitle>
              <CardDescription>
                {pendingProject.length}명 / 정상 교육생 {summary.active.length}명
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {pendingProject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">모든 교육생이 자료를 회신했습니다.</p>
                ) : (
                  pendingProject.map((student) => (
                    <Badge key={student.id} variant="outline">
                      {student.name}
                    </Badge>
                  ))
                )}
              </div>
              <Separator />
              <Button variant="outline" render={<Link href="/students" />} nativeButton={false}>
                교육생 관리로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">출석 상태 집계</CardTitle>
          <CardDescription>정상 교육생 기준 전체 기간 누적 건수</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {(["present", "late", "early", "absent", "official", "sick", "outing", "etc"] as const).map((status) => {
              const total = summary.activeStats.reduce((sum, item) => sum + item.stats.counts[status], 0)
              return (
                <div key={status} className="flex flex-col gap-1">
                  <StatusBadge status={status} />
                  <span className="text-xl font-semibold tabular-nums">{total}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
