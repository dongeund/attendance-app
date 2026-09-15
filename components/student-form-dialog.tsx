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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useStore } from "@/components/data-store"
import type { Course, Student } from "@/lib/types"

export function StudentFormDialog({
  student,
  course,
  onClose,
}: {
  student: Student | "new"
  course: Course
  onClose: () => void
}) {
  const { students, saveStudent } = useStore()
  const nextNo = Math.max(0, ...students.filter((s) => s.courseId === course.id).map((s) => s.no)) + 1

  const [draft, setDraft] = useState<Student>(
    student === "new"
      ? {
          id: `s-${Date.now()}`,
          courseId: course.id,
          no: nextNo,
          name: "",
          eduId: "",
          phone: "",
          email: "",
          status: "active",
          projectReturn: "pending",
          certificates: [],
        }
      : { ...student, certificates: [...student.certificates] },
  )
  const [certName, setCertName] = useState("")
  const [certDate, setCertDate] = useState("")

  const valid = draft.name.trim() && draft.eduId.trim()

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{student === "new" ? "교육생 등록" : "교육생 정보 수정"}</DialogTitle>
          <DialogDescription>
            {course.name} {course.cohort}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <div className="grid grid-cols-4 gap-4">
            <Field>
              <FieldLabel htmlFor="st-no">번호</FieldLabel>
              <Input
                id="st-no"
                type="number"
                min={1}
                value={draft.no}
                className="tabular-nums"
                onChange={(event) => setDraft({ ...draft, no: Number(event.target.value) })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="st-name">이름</FieldLabel>
              <Input
                id="st-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field className="col-span-2">
              <FieldLabel htmlFor="st-eduid">교육 ID</FieldLabel>
              <Input
                id="st-eduid"
                value={draft.eduId}
                placeholder="예: CBD-2026-001"
                className="tabular-nums"
                onChange={(event) => setDraft({ ...draft, eduId: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="st-phone">연락처</FieldLabel>
              <Input
                id="st-phone"
                value={draft.phone}
                placeholder="010-0000-0000"
                className="tabular-nums"
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="st-email">이메일</FieldLabel>
              <Input
                id="st-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </Field>
          </div>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="st-project" className="flex flex-col items-start gap-0.5">
              프로젝트 자료 회신
              <FieldDescription>회신 완료 시 켜 주세요.</FieldDescription>
            </FieldLabel>
            <Switch
              id="st-project"
              checked={draft.projectReturn === "submitted"}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, projectReturn: checked ? "submitted" : "pending" })
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cert-name">자격증</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="cert-name"
                value={certName}
                placeholder="자격증명 (예: 정보처리기사)"
                className="w-56"
                onChange={(event) => setCertName(event.target.value)}
              />
              <Input
                type="date"
                value={certDate}
                className="w-40"
                aria-label="취득일"
                onChange={(event) => setCertDate(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!certName.trim()}
                onClick={() => {
                  setDraft({
                    ...draft,
                    certificates: [
                      ...draft.certificates,
                      { id: `cert-${Date.now()}`, name: certName.trim(), acquiredAt: certDate },
                    ],
                  })
                  setCertName("")
                  setCertDate("")
                }}
              >
                <Plus data-icon="inline-start" />
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {draft.certificates.length === 0 ? (
                <span className="text-xs text-muted-foreground">등록된 자격증이 없습니다. 여러 개 등록 가능합니다.</span>
              ) : (
                draft.certificates.map((cert) => (
                  <Badge key={cert.id} variant="secondary" className="gap-1">
                    {cert.name}
                    {cert.acquiredAt ? <span className="text-muted-foreground tabular-nums">{cert.acquiredAt}</span> : null}
                    <button
                      type="button"
                      aria-label={`${cert.name} 삭제`}
                      onClick={() =>
                        setDraft({ ...draft, certificates: draft.certificates.filter((c) => c.id !== cert.id) })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="st-memo">비고</FieldLabel>
            <Textarea
              id="st-memo"
              rows={2}
              value={draft.memo ?? ""}
              placeholder="상담 이력, 특이사항 등"
              onChange={(event) => setDraft({ ...draft, memo: event.target.value })}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              saveStudent(draft)
              toast.success(`${draft.name} 교육생 정보를 저장했습니다.`)
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
