// src/components/app-sidebar.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import sidebarData from "@/data/sidebar.json";
import { iconMap } from "@/lib/icon-map";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

function resolveIcons(navItems: any[]) {
  return navItems.map((item) => ({
    ...item,
    icon: iconMap[item.icon] || undefined,
    items: item.items
      ? item.items.map((subItem: any) => ({
          ...subItem,
          icon: iconMap[subItem.icon] || undefined,
        }))
      : [],
  }));
}

function resolveTeams(teams: any[]) {
  return teams.map((team) => ({
    ...team,
    logo: iconMap[team.logo] || undefined,
  }));
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    const userCookie = getCookie("user") as string | undefined;
    console.log("AppSidebar: User cookie:", userCookie);

    if (!userCookie) {
      console.log("AppSidebar: No user cookie, redirecting to /login");
      router.replace("/login");
      return;
    }

    try {
      // Decode and parse the cookie
      const decodedUser = JSON.parse(decodeURIComponent(userCookie || ""));
      console.log("AppSidebar: Parsed user:", decodedUser);

      // Validate required fields
      if (decodedUser.name && decodedUser.email) {
        setUser({
          name: decodedUser.name,
          email: decodedUser.email,
          avatar: decodedUser.avatar || "", // Use empty string if avatar is missing
        });
      } else {
        console.log("AppSidebar: Invalid user data, redirecting to /login");
        router.replace("/login");
      }
    } catch (error) {
      console.error("AppSidebar: Error parsing user cookie:", error);
      router.replace("/login");
    }
  }, [router]);

  // Show nothing or a loading state while user is being fetched
  if (!user) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={resolveTeams(sidebarData.teams)} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={resolveIcons(sidebarData.navMain)} />
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4 text-sm text-gray-500">Loading user...</div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={resolveTeams(sidebarData.teams)} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={resolveIcons(sidebarData.navMain)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
