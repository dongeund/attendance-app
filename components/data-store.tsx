"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { buildAttendanceRecords, courses as seedCourses, officialLeaves, students as seedStudents } from "@/lib/mock-data"
import { getEducationDates, recordKey } from "@/lib/attendance"
import type { AttendanceRecord, Course, OfficialLeave, Student } from "@/lib/types"

interface StoreValue {
  courses: Course[]
  students: Student[]
  records: Record<string, AttendanceRecord>
  leaves: OfficialLeave[]
  excludeLeaveFromRate: boolean
  setExcludeLeaveFromRate: (value: boolean) => void
  activeCourseId: string
  setActiveCourseId: (id: string) => void
  datesByCourse: Record<string, string[]>
  saveCourse: (course: Course) => void
  saveStudent: (student: Student) => void
  withdrawStudent: (id: string, payload: { withdrawnAt: string; withdrawnReason: string; withdrawnNote: string }) => void
  restoreStudent: (id: string) => void
  saveRecord: (record: AttendanceRecord) => void
  removeRecord: (studentId: string, date: string) => void
  bulkSaveRecords: (records: AttendanceRecord[]) => void
  saveLeave: (leave: OfficialLeave) => void
  removeLeave: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(seedCourses)
  const [students, setStudents] = useState<Student[]>(seedStudents)
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => buildAttendanceRecords())
  const [leaves, setLeaves] = useState<OfficialLeave[]>(officialLeaves)
  const [excludeLeaveFromRate, setExcludeLeaveFromRate] = useState(true)
  const [activeCourseId, setActiveCourseId] = useState(seedCourses[0].id)

  const datesByCourse = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const course of courses) out[course.id] = getEducationDates(course)
    return out
  }, [courses])

  const value = useMemo<StoreValue>(
    () => ({
      courses,
      students,
      records,
      leaves,
      excludeLeaveFromRate,
      setExcludeLeaveFromRate,
      activeCourseId,
      setActiveCourseId,
      datesByCourse,
      saveCourse: (course) =>
        setCourses((prev) =>
          prev.some((c) => c.id === course.id) ? prev.map((c) => (c.id === course.id ? course : c)) : [...prev, course],
        ),
      saveStudent: (student) =>
        setStudents((prev) =>
          prev.some((s) => s.id === student.id)
            ? prev.map((s) => (s.id === student.id ? student : s))
            : [...prev, student],
        ),
      withdrawStudent: (id, payload) =>
        setStudents((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "withdrawn",
                  withdrawnAt: payload.withdrawnAt,
                  withdrawnReason: payload.withdrawnReason,
                  withdrawnNote: payload.withdrawnNote,
                }
              : s,
          ),
        ),
      restoreStudent: (id) =>
        setStudents((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: "active", withdrawnAt: undefined, withdrawnReason: undefined, withdrawnNote: undefined }
              : s,
          ),
        ),
      saveRecord: (record) =>
        setRecords((prev) => ({ ...prev, [recordKey(record.studentId, record.date)]: record })),
      removeRecord: (studentId, date) =>
        setRecords((prev) => {
          const next = { ...prev }
          delete next[recordKey(studentId, date)]
          return next
        }),
      bulkSaveRecords: (list) =>
        setRecords((prev) => {
          const next = { ...prev }
          for (const record of list) next[recordKey(record.studentId, record.date)] = record
          return next
        }),
      saveLeave: (leave) =>
        setLeaves((prev) =>
          prev.some((l) => l.id === leave.id) ? prev.map((l) => (l.id === leave.id ? leave : l)) : [...prev, leave],
        ),
      removeLeave: (id) => setLeaves((prev) => prev.filter((l) => l.id !== id)),
    }),
    [courses, students, records, leaves, excludeLeaveFromRate, activeCourseId, datesByCourse],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used inside DataStoreProvider")
  return context
}

export function useActiveCourse() {
  const { courses, activeCourseId } = useStore()
  return courses.find((c) => c.id === activeCourseId) ?? courses[0]
}
