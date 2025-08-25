"use client"
import { Monitor, FileText, Package, LogOut } from "lucide-react"
import Image from "next/image"
import { logout } from "../lib/api"

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
  const handleLogout = () => {
    logout()
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
  <div className="flex h-16 items-center justify-center p-4">
    <Image
      src="/logo.png"
      alt="Device Manager Logo"
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
        
        {/* Logout Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={handleLogout}>
                  <button className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
