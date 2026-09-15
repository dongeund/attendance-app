"use client"

import { AttendanceBoard } from "@/components/attendance-board"
import { SummaryCards } from "@/components/summary-cards"
import { PageHeader } from "@/components/page-header"
import { useActiveCourse } from "@/components/data-store"

export default function AttendancePage() {
  const course = useActiveCourse()

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="출석부"
        description="날짜 셀을 클릭하면 출석 상세를 수정할 수 있습니다. 왼쪽 기본정보와 상단 날짜 행은 스크롤 시에도 고정됩니다."
      />
      <SummaryCards course={course} />
      <AttendanceBoard course={course} />
    </div>
  )
}
