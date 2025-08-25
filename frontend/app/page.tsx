"use client"
import dynamic from 'next/dynamic'
import { Protected } from "@/src/components/Protected"

const Component = dynamic(() => import("../dashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full animate-pulse">
      <div className="w-64 bg-muted border-r"></div>
      <div className="flex-1">
        <div className="h-16 border-b bg-background"></div>
        <div className="p-6 space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
})

export default function Page() {
  return (
    <Protected>
      <Component />
    </Protected>
  )
}
