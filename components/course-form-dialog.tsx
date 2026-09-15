"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useStore } from "@/components/data-store"
import { getEducationDates, formatMinutes } from "@/lib/attendance"
import type { Course } from "@/lib/types"

const emptyCourse = (): Course => ({
  id: `c-${Date.now()}`,
  name: "",
  cohort: "",
  startDate: "",
  endDate: "",
  dailyMinutes: 480,
  holidays: [],
  manager: "",
})

export function CourseFormDialog({ course, onClose }: { course: Course | "new"; onClose: () => void }) {
  const { saveCourse } = useStore()
  const [draft, setDraft] = useState<Course>(course === "new" ? emptyCourse() : { ...course })
  const [holidayDate, setHolidayDate] = useState("")
  const [holidayLabel, setHolidayLabel] = useState("")

  const valid = draft.name && draft.cohort && draft.startDate && draft.endDate && draft.endDate >= draft.startDate
  const previewDates = valid ? getEducationDates(draft) : []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{course === "new" ? "과정 등록" : "과정 정보 수정"}</DialogTitle>
          <DialogDescription>
            교육기간을 저장하면 주말과 공휴일을 제외한 출석부 날짜 헤더가 자동 생성됩니다.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <div className="grid grid-cols-3 gap-4">
            <Field className="col-span-2">
              <FieldLabel htmlFor="course-name">과정명</FieldLabel>
              <Input
                id="course-name"
                value={draft.name}
                placeholder="예: 클라우드 기반 백엔드 개발자 양성과정"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-cohort">기수</FieldLabel>
              <Input
                id="course-cohort"
                value={draft.cohort}
                placeholder="예: 3기"
                onChange={(event) => setDraft({ ...draft, cohort: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="course-start">교육 시작일</FieldLabel>
              <Input
                id="course-start"
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-end">교육 종료일</FieldLabel>
              <Input
                id="course-end"
                type="date"
                value={draft.endDate}
                onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="course-minutes">일일 교육시간 (분)</FieldLabel>
              <Input
                id="course-minutes"
                type="number"
                min={60}
                max={720}
                step={30}
                value={draft.dailyMinutes}
                className="tabular-nums"
                onChange={(event) => setDraft({ ...draft, dailyMinutes: Number(event.target.value) })}
              />
              <FieldDescription>{formatMinutes(draft.dailyMinutes || 0)} / 일</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="course-manager">운영 담당자</FieldLabel>
              <Input
                id="course-manager"
                value={draft.manager}
                placeholder="예: 김민서"
                onChange={(event) => setDraft({ ...draft, manager: event.target.value })}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="holiday-date">공휴일 관리</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="holiday-date"
                type="date"
                value={holidayDate}
                className="w-40"
                onChange={(event) => setHolidayDate(event.target.value)}
              />
              <Input
                value={holidayLabel}
                placeholder="공휴일명"
                className="w-36"
                onChange={(event) => setHolidayLabel(event.target.value)}
                aria-label="공휴일명"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!holidayDate}
                onClick={() => {
                  if (draft.holidays.some((h) => h.date === holidayDate)) return
                  setDraft({
                    ...draft,
                    holidays: [...draft.holidays, { date: holidayDate, label: holidayLabel || "공휴일" }].sort((a, b) =>
                      a.date.localeCompare(b.date),
                    ),
                  })
                  setHolidayDate("")
                  setHolidayLabel("")
                }}
              >
                <Plus data-icon="inline-start" />
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {draft.holidays.length === 0 ? (
                <span className="text-xs text-muted-foreground">등록된 공휴일이 없습니다. 주말은 기본 제외됩니다.</span>
              ) : (
                draft.holidays.map((holiday) => (
                  <Badge key={holiday.date} variant="secondary" className="gap-1">
                    <span className="tabular-nums">{holiday.date}</span> {holiday.label}
                    <button
                      type="button"
                      aria-label={`${holiday.date} 공휴일 삭제`}
                      onClick={() =>
                        setDraft({ ...draft, holidays: draft.holidays.filter((h) => h.date !== holiday.date) })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <FieldDescription>
              자동 생성 교육일 {previewDates.length}일 · 총 교육 예정시간{" "}
              {formatMinutes(previewDates.length * (draft.dailyMinutes || 0))}
            </FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              saveCourse(draft)
              toast.success(`${draft.name} ${draft.cohort} 과정을 저장했습니다.`)
              onClose()
            }}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
