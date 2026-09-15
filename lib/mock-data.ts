import { getEducationDates, recordKey, defaultRecordForStatus } from "./attendance"
import type { AttendanceRecord, AttendanceStatus, Course, OfficialLeave, Student } from "./types"

export const courses: Course[] = [
  {
    id: "c-1",
    name: "클라우드 기반 백엔드 개발자 양성과정",
    cohort: "3기",
    startDate: "2026-06-01",
    endDate: "2026-08-21",
    dailyMinutes: 480,
    manager: "김민서",
    holidays: [
      { date: "2026-06-03", label: "지방선거일" },
      { date: "2026-06-06", label: "현충일" },
      { date: "2026-08-17", label: "광복절 대체공휴일" },
    ],
  },
  {
    id: "c-2",
    name: "데이터 분석 & AI 실무 과정",
    cohort: "7기",
    startDate: "2026-07-06",
    endDate: "2026-09-25",
    dailyMinutes: 420,
    manager: "이도현",
    holidays: [{ date: "2026-08-17", label: "광복절 대체공휴일" }],
  },
]

const namesA = [
  "강태호",
  "고은서",
  "김도윤",
  "김서연",
  "김지훈",
  "노하늘",
  "문채원",
  "박성민",
  "박예진",
  "서준혁",
  "손예린",
  "신우빈",
  "안다현",
  "오세영",
  "윤지아",
  "이건우",
  "이수아",
  "임현우",
  "장민재",
  "정유나",
  "조하린",
  "최이든",
  "한소율",
  "황재원",
]

const namesB = [
  "구본희",
  "김나윤",
  "남시우",
  "류지완",
  "민가온",
  "배수현",
  "성지호",
  "양우진",
  "엄채아",
  "우준호",
  "전예서",
  "차민규",
  "표하윤",
  "홍서진",
]

const certPool = [
  "정보처리기사",
  "SQLD",
  "리눅스마스터 2급",
  "AWS SAA",
  "빅데이터분석기사",
  "ADsP",
  "정보처리산업기사",
]

/** 결정적 의사난수 (SSR/CSR 동일 결과 보장) */
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

function buildStudents(course: Course, names: string[], prefix: string, withdrawn: number[]): Student[] {
  return names.map((name, index) => {
    const no = index + 1
    const id = `${prefix}-s${no}`
    const isWithdrawn = withdrawn.includes(no)
    const certCount = Math.floor(seeded(`cert${id}`) * 3)
    return {
      id,
      courseId: course.id,
      no,
      name: name.replace(/[^가-힣]/g, "") || `교육생${no}`,
      eduId: `${prefix.toUpperCase()}-2026-${String(no).padStart(3, "0")}`,
      phone: `010-${String(2000 + Math.floor(seeded(`p1${id}`) * 7999)).padStart(4, "0")}-${String(
        Math.floor(seeded(`p2${id}`) * 9999),
      ).padStart(4, "0")}`,
      email: `${prefix}user${no}@example.com`,
      status: isWithdrawn ? "withdrawn" : "active",
      withdrawnAt: isWithdrawn ? (no % 2 === 0 ? "2026-06-26" : "2026-07-10") : undefined,
      withdrawnReason: isWithdrawn ? (no % 2 === 0 ? "취업" : "개인사정") : undefined,
      withdrawnNote: isWithdrawn ? (no % 2 === 0 ? "중견 SI 기업 백엔드 입사" : "건강상 이유로 중도 포기") : undefined,
      projectReturn: seeded(`prj${id}`) > 0.32 ? "submitted" : "pending",
      certificates: Array.from({ length: certCount }).map((_, i) => ({
        id: `${id}-cert${i}`,
        name: certPool[Math.floor(seeded(`cn${id}${i}`) * certPool.length)],
        acquiredAt: `2026-0${3 + i}-1${i + 2}`,
      })),
    }
  })
}

export const students: Student[] = [
  ...buildStudents(courses[0], namesA, "cbd", [7, 18]),
  ...buildStudents(courses[1], namesB, "dai", [11]),
]

export const officialLeaves: OfficialLeave[] = [
  {
    id: "l-1",
    studentId: "cbd-s3",
    startDate: "2026-06-15",
    endDate: "2026-06-16",
    reason: "예비군 훈련",
    approved: true,
    excludeFromRate: true,
    attachment: "예비군소집통지서.pdf",
  },
  {
    id: "l-2",
    studentId: "cbd-s9",
    startDate: "2026-07-02",
    endDate: "2026-07-02",
    reason: "취업 면접 (S사 백엔드)",
    approved: true,
    excludeFromRate: true,
  },
  {
    id: "l-3",
    studentId: "cbd-s14",
    startDate: "2026-07-20",
    endDate: "2026-07-21",
    reason: "가족 경조사",
    approved: false,
    excludeFromRate: true,
  },
  {
    id: "l-4",
    studentId: "dai-s5",
    startDate: "2026-08-03",
    endDate: "2026-08-03",
    reason: "국가자격시험 응시",
    approved: true,
    excludeFromRate: false,
  },
]

function pickStatus(seed: number, index: number): AttendanceStatus {
  if (seed > 0.955) return "absent"
  if (seed > 0.925) return "late"
  if (seed > 0.9) return "early"
  if (seed > 0.888) return index % 2 === 0 ? "sick" : "outing"
  return "present"
}

/** 오늘 기준 데이터가 입력된 마지막 날짜 (이후는 미입력 상태로 남겨둠) */
export const dataCutoff: Record<string, string> = {
  "c-1": "2026-07-24",
  "c-2": "2026-08-14",
}

export function buildAttendanceRecords(): Record<string, AttendanceRecord> {
  const map: Record<string, AttendanceRecord> = {}

  for (const course of courses) {
    const dates = getEducationDates(course)
    const cutoff = dataCutoff[course.id]
    const courseStudents = students.filter((s) => s.courseId === course.id)

    for (const student of courseStudents) {
      const bias = seeded(`bias${student.id}`)
      for (const date of dates) {
        if (date > cutoff) continue
        if (student.status === "withdrawn" && student.withdrawnAt && date > student.withdrawnAt) continue

        const leave = officialLeaves.find(
          (l) => l.studentId === student.id && l.approved && date >= l.startDate && date <= l.endDate,
        )

        let status: AttendanceStatus
        if (leave) {
          status = "official"
        } else {
          const roll = seeded(`${student.id}${date}`) * (bias < 0.16 ? 1.07 : 1)
          status = pickStatus(roll, student.no)
        }

        const base = defaultRecordForStatus(status, course)
        map[recordKey(student.id, date)] = {
          studentId: student.id,
          date,
          status,
          checkIn: base.checkIn,
          checkOut: base.checkOut,
          minutes: base.minutes,
          note:
            status === "official"
              ? (leave?.reason ?? "공가")
              : status === "late"
                ? "교통 지연"
                : status === "absent"
                  ? "무단 결석"
                  : status === "sick"
                    ? "병원 진료"
                    : "",
        }
      }
    }
  }

  return map
}
