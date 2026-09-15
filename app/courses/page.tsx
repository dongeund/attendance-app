"use client"

import { useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { CourseFormDialog } from "@/components/course-form-dialog"
import { useStore } from "@/components/data-store"
import { formatMinutes } from "@/lib/attendance"
import type { Course } from "@/lib/types"

export default function CoursesPage() {
  const { courses, students, datesByCourse, activeCourseId, setActiveCourseId } = useStore()
  const [editing, setEditing] = useState<Course | "new" | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="과정 관리"
        description="과정명, 기수, 교육기간, 일일 교육시간과 공휴일을 관리합니다."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus data-icon="inline-start" />
            과정 등록
          </Button>
        }
      />

      <Card className="p-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">과정명</TableHead>
                <TableHead>기수</TableHead>
                <TableHead>교육기간</TableHead>
                <TableHead className="text-right">교육일</TableHead>
                <TableHead className="text-right">일일 교육시간</TableHead>
                <TableHead className="text-right">총 교육시간</TableHead>
                <TableHead className="text-right">교육생</TableHead>
                <TableHead>공휴일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const dates = datesByCourse[course.id] ?? []
                const roster = students.filter((s) => s.courseId === course.id)
                return (
                  <TableRow key={course.id} data-state={course.id === activeCourseId ? "selected" : undefined}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {course.name}
                        {course.id === activeCourseId ? <Badge variant="secondary">선택됨</Badge> : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">담당자 {course.manager}</span>
                    </TableCell>
                    <TableCell>{course.cohort}</TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {course.startDate} ~ {course.endDate}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{dates.length}일</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMinutes(course.dailyMinutes)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMinutes(dates.length * course.dailyMinutes)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {roster.filter((s) => s.status === "active").length}/{roster.length}명
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {course.holidays.length === 0 ? "-" : `${course.holidays.length}일`}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setActiveCourseId(course.id)}>
                          선택
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditing(course)}>
                          <Pencil data-icon="inline-start" />
                          수정
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing ? <CourseFormDialog course={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}
