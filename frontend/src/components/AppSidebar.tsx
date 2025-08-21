"use client"
import { Monitor, FileText, Package } from "lucide-react"
import Image from "next/image"

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
  {
    title: "Versions",
    icon: Package,
    id: "versions",
  },
]

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  return (
    <Sidebar>
<SidebarHeader>
  <div className="flex items-center justify-center px-4 py-4">
    <Image
      src="/logo.png"
      alt="Logo"
      width={68}
      height={68}
      className="object-contain"
    />
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
