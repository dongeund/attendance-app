"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck2,
  GraduationCap,
  LayoutDashboard,
  Layers,
  UserMinus,
  Users,
  FileCheck2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/components/data-store"

const nav = [
  { href: "/", label: "대시보드", icon: LayoutDashboard, group: "현황" },
  { href: "/attendance", label: "출석부", icon: CalendarCheck2, group: "현황" },
  { href: "/courses", label: "과정 관리", icon: Layers, group: "운영 관리" },
  { href: "/students", label: "교육생 관리", icon: Users, group: "운영 관리" },
  { href: "/leaves", label: "공가 관리", icon: FileCheck2, group: "운영 관리" },
  { href: "/withdrawn", label: "퇴소자 관리", icon: UserMinus, group: "운영 관리" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    courses,
    students,
    leaves,
    activeCourseId,
    setActiveCourseId,
    excludeLeaveFromRate,
    setExcludeLeaveFromRate,
  } = useStore()

  const courseStudents = students.filter((s) => s.courseId === activeCourseId)
  const counts: Record<string, number> = {
    "/students": courseStudents.filter((s) => s.status === "active").length,
    "/withdrawn": courseStudents.filter((s) => s.status === "withdrawn").length,
    "/leaves": leaves.filter((l) => courseStudents.some((s) => s.id === l.studentId) && !l.approved).length,
  }

  const groups = ["현황", "운영 관리"]

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-4.5" />
            </div>
            <div className="grid min-w-0 gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold leading-tight">출석관리 시스템</span>
              <span className="truncate text-xs text-muted-foreground">교육 운영 관리자</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={pathname === item.href}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                          nativeButton={false}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {counts[item.href] ? <SidebarMenuBadge>{counts[item.href]}</SidebarMenuBadge> : null}
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t group-data-[collapsible=icon]:hidden">
          <div className="flex items-start justify-between gap-2 px-1 py-1">
            <Label htmlFor="exclude-leave" className="flex flex-col items-start gap-0.5 text-xs font-medium">
              공가일 출석률 제외
              <span className="text-[11px] font-normal text-muted-foreground">승인된 공가를 분모에서 제외</span>
            </Label>
            <Switch id="exclude-leave" checked={excludeLeaveFromRate} onCheckedChange={setExcludeLeaveFromRate} />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium text-muted-foreground">과정 선택</span>
          <Select value={activeCourseId} onValueChange={(value) => setActiveCourseId(value as string)}>
            <SelectTrigger className="w-[360px]" aria-label="과정 선택">
              <SelectValue placeholder="과정을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} · {course.cohort}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden lg:inline">운영 담당자</span>
            <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">admin@edu.kr</span>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
