"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/components/data-store"
import { defaultRecordForStatus, formatMinutes, minutesBetween, recordKey, WEEKDAY_KO, parseDate } from "@/lib/attendance"
import { STATUS_META, STATUS_ORDER, type AttendanceStatus, type Course, type Student } from "@/lib/types"

export interface CellTarget {
  student: Student
  date: string
}

export function AttendanceDetailDialog({
  target,
  course,
  onClose,
}: {
  target: CellTarget | null
  course: Course
  onClose: () => void
}) {
  const { records, saveRecord, removeRecord } = useStore()
  const existing = target ? records[recordKey(target.student.id, target.date)] : undefined

  const [status, setStatus] = useState<AttendanceStatus>("present")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [minutes, setMinutes] = useState(0)
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!target) return
    if (existing) {
      setStatus(existing.status)
      setCheckIn(existing.checkIn ?? "")
      setCheckOut(existing.checkOut ?? "")
      setMinutes(existing.minutes)
      setNote(existing.note)
    } else {
      const base = defaultRecordForStatus("present", course)
      setStatus("present")
      setCheckIn(base.checkIn ?? "")
      setCheckOut(base.checkOut ?? "")
      setMinutes(base.minutes)
      setNote("")
    }
  }, [target, existing, course])

  const applyStatus = (next: AttendanceStatus) => {
    setStatus(next)
    const base = defaultRecordForStatus(next, course)
    setCheckIn(base.checkIn ?? "")
    setCheckOut(base.checkOut ?? "")
    setMinutes(base.minutes)
  }

  const recalc = () => {
    const gross = minutesBetween(checkIn || null, checkOut || null)
    const net = gross > 300 ? gross - 60 : gross // 5시간 초과 시 점심 1시간 제외
    setMinutes(Math.max(0, net))
  }

  if (!target) return null

  const dateObj = parseDate(target.date)
  const weekday = WEEKDAY_KO[dateObj.getDay()]

  const handleSave = () => {
    saveRecord({
      studentId: target.student.id,
      date: target.date,
      status,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      minutes: Number.isFinite(minutes) ? Math.max(0, Math.min(minutes, 1440)) : 0,
      note,
    })
    toast.success(`${target.student.name} · ${target.date} 출석 정보를 저장했습니다.`)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>출석 상세</DialogTitle>
          <DialogDescription>
            {course.name} {course.cohort} · 일일 교육시간 {formatMinutes(course.dailyMinutes)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="grid gap-0.5">
            <span className="text-xs text-muted-foreground">교육생</span>
            <span className="font-medium">
              {target.student.name}{" "}
              <span className="font-normal text-muted-foreground">({target.student.eduId})</span>
            </span>
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs text-muted-foreground">날짜</span>
            <span className="font-medium tabular-nums">
              {target.date} ({weekday})
            </span>
          </div>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="att-status">출석상태</FieldLabel>
            <Select value={status} onValueChange={(value) => applyStatus(value as AttendanceStatus)}>
              <SelectTrigger id="att-status" className="w-full">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_ORDER.map((item) => (
                    <SelectItem key={item} value={item}>
                      {STATUS_META[item].label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>상태를 바꾸면 기본 입·퇴실 시간과 교육시간이 자동 입력됩니다.</FieldDescription>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="att-in">입실시간</FieldLabel>
              <Input
                id="att-in"
                type="time"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                onBlur={recalc}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="att-out">퇴실시간</FieldLabel>
              <Input
                id="att-out"
                type="time"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                onBlur={recalc}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="att-min">교육시간 (분)</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="att-min"
                type="number"
                min={0}
                max={1440}
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="tabular-nums"
              />
              <Button type="button" variant="outline" onClick={recalc}>
                시간 자동계산
              </Button>
            </div>
            <FieldDescription>
              저장 단위는 분입니다. 현재 {minutes}분 = {formatMinutes(minutes)} · 일일 기준{" "}
              {Math.round((minutes / course.dailyMinutes) * 100)}%
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="att-note">비고</FieldLabel>
            <Textarea
              id="att-note"
              value={note}
              rows={2}
              placeholder="예: 병원 진료 후 오후 입실"
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={!existing}
            onClick={() => {
              removeRecord(target.student.id, target.date)
              toast.success("출석 기록을 삭제했습니다. (미입력 상태)")
              onClose()
            }}
          >
            <Trash2 data-icon="inline-start" />
            기록 삭제
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="button" onClick={handleSave}>
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
