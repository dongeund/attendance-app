import type { AttendanceRecord, AttendanceStatus, Course, OfficialLeave, Student } from "./types"

export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

export function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** 교육기간 내 날짜 전체 (주말 제외 여부 무시) */
export function eachDay(start: string, end: string) {
  const out: Date[] = []
  const cursor = parseDate(start)
  const last = parseDate(end)
  while (cursor.getTime() <= last.getTime()) {
    out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** 출석부 날짜 헤더 자동 생성: 주말/공휴일 제외 */
export function getEducationDates(course: Course): string[] {
  const holidays = new Set(course.holidays.map((h) => h.date))
  return eachDay(course.startDate, course.endDate)
    .filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
    .map(toDateKey)
    .filter((key) => !holidays.has(key))
}

export function recordKey(studentId: string, date: string) {
  return `${studentId}|${date}`
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

export function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`
}

export function minutesBetween(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return 0
  const [ih, im] = checkIn.split(":").map(Number)
  const [oh, om] = checkOut.split(":").map(Number)
  return Math.max(0, oh * 60 + om - (ih * 60 + im))
}

export function isDateInLeave(leave: OfficialLeave, date: string) {
  return date >= leave.startDate && date <= leave.endDate
}

export interface StudentStats {
  totalMinutes: number
  plannedMinutes: number
  rate: number
  counts: Record<AttendanceStatus, number>
  leaveDays: number
  unrecorded: number
}

export function computeStudentStats(options: {
  student: Student
  course: Course
  dates: string[]
  records: Record<string, AttendanceRecord>
  leaves: OfficialLeave[]
  excludeLeaveFromRate: boolean
}): StudentStats {
  const { student, course, dates, records, leaves, excludeLeaveFromRate } = options
  const counts = {
    present: 0,
    late: 0,
    early: 0,
    absent: 0,
    official: 0,
    sick: 0,
    outing: 0,
    etc: 0,
  } as Record<AttendanceStatus, number>

  const approvedLeaves = leaves.filter((l) => l.studentId === student.id && l.approved && l.excludeFromRate)

  let totalMinutes = 0
  let leaveDays = 0
  let unrecorded = 0
  let plannedDays = 0

  for (const date of dates) {
    // 퇴소 이후 날짜는 집계 대상에서 제외
    if (student.status === "withdrawn" && student.withdrawnAt && date > student.withdrawnAt) continue

    const record = records[recordKey(student.id, date)]
    const onLeave = approvedLeaves.some((l) => isDateInLeave(l, date))

    if (onLeave) leaveDays += 1

    if (!(onLeave && excludeLeaveFromRate)) plannedDays += 1

    if (!record) {
      unrecorded += 1
      continue
    }
    counts[record.status] += 1
    totalMinutes += record.minutes
  }

  const plannedMinutes = plannedDays * course.dailyMinutes
  const rate = plannedMinutes === 0 ? 0 : Math.min(100, (totalMinutes / plannedMinutes) * 100)

  return { totalMinutes, plannedMinutes, rate, counts, leaveDays, unrecorded }
}

export function rateTone(rate: number) {
  if (rate >= 90) return "text-present"
  if (rate >= 80) return "text-warn"
  return "text-danger"
}

export function defaultRecordForStatus(status: AttendanceStatus, course: Course) {
  const dailyHours = course.dailyMinutes / 60
  const start = "09:00"
  const endHour = 9 + dailyHours + 1 // 점심 1시간 가정
  const end = `${String(Math.floor(endHour)).padStart(2, "0")}:${String(Math.round((endHour % 1) * 60)).padStart(2, "0")}`
  switch (status) {
    case "present":
      return { checkIn: start, checkOut: end, minutes: course.dailyMinutes }
    case "late":
      return { checkIn: "09:40", checkOut: end, minutes: course.dailyMinutes - 40 }
    case "early":
      return { checkIn: start, checkOut: "16:00", minutes: course.dailyMinutes - 120 }
    case "absent":
      return { checkIn: null, checkOut: null, minutes: 0 }
    case "official":
    case "sick":
      return { checkIn: null, checkOut: null, minutes: 0 }
    case "outing":
      return { checkIn: start, checkOut: end, minutes: course.dailyMinutes - 60 }
    default:
      return { checkIn: null, checkOut: null, minutes: 0 }
  }
}
