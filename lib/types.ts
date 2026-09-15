export type AttendanceStatus =
  | "present" // 출석
  | "late" // 지각
  | "early" // 조퇴
  | "absent" // 결석
  | "official" // 공가
  | "sick" // 병가
  | "outing" // 외출
  | "etc" // 기타

export type StudentStatus = "active" | "withdrawn"

export type ProjectReturnStatus = "submitted" | "pending"

export interface Course {
  id: string
  name: string
  cohort: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  dailyMinutes: number
  holidays: { date: string; label: string }[]
  manager: string
}

export interface Certificate {
  id: string
  name: string
  acquiredAt: string
}

export interface Student {
  id: string
  courseId: string
  no: number
  name: string
  eduId: string
  phone: string
  email: string
  status: StudentStatus
  projectReturn: ProjectReturnStatus
  certificates: Certificate[]
  withdrawnAt?: string
  withdrawnReason?: string
  withdrawnNote?: string
  memo?: string
}

export interface AttendanceRecord {
  studentId: string
  date: string
  status: AttendanceStatus
  checkIn: string | null // HH:mm
  checkOut: string | null // HH:mm
  minutes: number
  note: string
}

export interface OfficialLeave {
  id: string
  studentId: string
  startDate: string
  endDate: string
  reason: string
  approved: boolean
  excludeFromRate: boolean
  attachment?: string
}

export const STATUS_META: Record<
  AttendanceStatus,
  { label: string; short: string; token: string; textToken: string }
> = {
  present: { label: "출석", short: "출", token: "bg-present/12", textToken: "text-present" },
  late: { label: "지각", short: "지", token: "bg-warn/15", textToken: "text-warn" },
  early: { label: "조퇴", short: "조", token: "bg-warn/15", textToken: "text-warn" },
  absent: { label: "결석", short: "결", token: "bg-danger/12", textToken: "text-danger" },
  official: { label: "공가", short: "공", token: "bg-info/14", textToken: "text-info" },
  sick: { label: "병가", short: "병", token: "bg-info/14", textToken: "text-info" },
  outing: { label: "외출", short: "외", token: "bg-muted", textToken: "text-muted-foreground" },
  etc: { label: "기타", short: "기", token: "bg-muted", textToken: "text-muted-foreground" },
}

export const STATUS_ORDER: AttendanceStatus[] = [
  "present",
  "late",
  "early",
  "absent",
  "official",
  "sick",
  "outing",
  "etc",
]
