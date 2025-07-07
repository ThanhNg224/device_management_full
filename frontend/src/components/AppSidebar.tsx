"use client"
import { Monitor, FileText } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { NavItem } from "../types"

interface AppSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const navItems: NavItem[] = [
  {
    title: "Devices",
    icon: Monitor,
    id: "devices",
  },
  {
    title: "Device Logs",
    icon: FileText,
    id: "logs",
  },
]

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Monitor className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">SunWorld</span>
            <span className="text-xs text-muted-foreground">Device Manager</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)}>
                    <button className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
