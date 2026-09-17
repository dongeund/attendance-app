"use client"

import { useEffect } from "react"
import { useStore } from "@/components/data-store"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fetchInitialData = useStore((state) => state.fetchInitialData)

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}