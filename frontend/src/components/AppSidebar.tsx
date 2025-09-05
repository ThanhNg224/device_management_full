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

  const handleLogoClick = () => {
    setActiveTab("devices") // Set to default tab (devices)
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex h-20 items-center justify-center p-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center justify-center p-0 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-full h-full"
            title="Go to Home"
          >
            <Image
              src="/logo.png"
              alt="Device Manager Logo"
              width={120}
              height={120}
              className="object-cover hover:scale-105 transition-transform duration-200 w-3/4 h-3/4 rounded-md"
            />
          </button>
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
