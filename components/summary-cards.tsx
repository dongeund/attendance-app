"use client"

import { useMemo } from "react"
import { UserCheck, UserMinus, Users, Percent } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useStore } from "@/components/data-store"
import { computeStudentStats, formatMinutes, rateTone } from "@/lib/attendance"
import type { Course } from "@/lib/types"

export function useCourseSummary(course: Course) {
  const { students, records, leaves, datesByCourse, excludeLeaveFromRate } = useStore()
  const dates = datesByCourse[course.id] ?? []

  return useMemo(() => {
    const courseStudents = students.filter((s) => s.courseId === course.id)
    const active = courseStudents.filter((s) => s.status === "active")
    const withdrawn = courseStudents.filter((s) => s.status === "withdrawn")

    const stats = courseStudents.map((student) => ({
      student,
      stats: computeStudentStats({ student, course, dates, records, leaves, excludeLeaveFromRate }),
    }))

    const activeStats = stats.filter((item) => item.student.status === "active")
    const averageRate =
      activeStats.length === 0 ? 0 : activeStats.reduce((sum, item) => sum + item.stats.rate, 0) / activeStats.length
    const totalMinutes = activeStats.reduce((sum, item) => sum + item.stats.totalMinutes, 0)

    return {
      dates,
      courseStudents,
      active,
      withdrawn,
      stats,
      activeStats,
      averageRate,
      totalMinutes,
      plannedMinutes: dates.length * course.dailyMinutes,
      lowAttendance: activeStats
        .filter((item) => item.stats.rate < 80)
        .sort((a, b) => a.stats.rate - b.stats.rate),
    }
  }, [students, course, dates, records, leaves, excludeLeaveFromRate])
}

export function SummaryCards({ course }: { course: Course }) {
  const summary = useCourseSummary(course)

  const cards = [
    {
      label: "전체 교육생",
      value: `${summary.courseStudents.length}명`,
      hint: `정원 기준 · 총 교육일 ${summary.dates.length}일`,
      icon: Users,
    },
    {
      label: "정상 교육생",
      value: `${summary.active.length}명`,
      hint: `누적 출석 ${formatMinutes(summary.totalMinutes)}`,
      icon: UserCheck,
    },
    {
      label: "퇴소자",
      value: `${summary.withdrawn.length}명`,
      hint: summary.withdrawn.length ? summary.withdrawn.map((s) => s.name).join(", ") : "퇴소자 없음",
      icon: UserMinus,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="gap-1.5">
            <CardDescription className="flex items-center gap-1.5">
              <card.icon className="size-4" aria-hidden="true" />
              {card.label}
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{card.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="gap-1.5">
          <CardDescription className="flex items-center gap-1.5">
            <Percent className="size-4" aria-hidden="true" />
            평균 출석률
          </CardDescription>
          <CardTitle className={cn("text-2xl tabular-nums", rateTone(summary.averageRate))}>
            {summary.averageRate.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Progress value={summary.averageRate} aria-label="평균 출석률" />
          <p className="text-xs text-muted-foreground">
            출석률 80% 미만 {summary.lowAttendance.length}명 관리 필요
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
