'use client'
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Define your route structure
const routeMap = {
  "/docs": "Documentation",
  "/docs/building-your-application": "Building Your Application",
  "/docs/building-your-application/data-fetching": "Data Fetching",
  "/docs/building-your-application/routing": "Routing",
  "/docs/building-your-application/styling": "Styling",
  "/docs/api-reference": "API Reference",
  "/docs/api-reference/components": "Components",
  // Add more routes as needed
};

export default function MainPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ path: string; label: string }>
  >([]);

  useEffect(() => {
    // Generate breadcrumbs based on current path
    const generateBreadcrumbs = () => {
      const paths = pathname.split("/").filter(Boolean);
      const breadcrumbItems = [];

      let currentPath = "";

      // Always add home as first breadcrumb
      breadcrumbItems.push({ path: "/", label: "Home" });

      // Build up the breadcrumbs based on path segments
      for (let i = 0; i < paths.length; i++) {
        currentPath += `/${paths[i]}`;
        const completePath = currentPath;

        // Use the route map for friendly names, or capitalize the path segment
        const label =
          routeMap[completePath] ||
          paths[i].charAt(0).toUpperCase() +
            paths[i].slice(1).replace(/-/g, " ");

        breadcrumbItems.push({ path: completePath, label });
      }

      setBreadcrumbs(breadcrumbItems);
    };

    generateBreadcrumbs();
  }, [pathname]);

  return (
    <main className="flex w-full h-screen flex-col items-center justify-between">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 shrink-0 items-center gap-2 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 fixed top-0 z-10 w-full bg-sidebar border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => {
                    // Last item should be the current page
                    const isLastItem = index === breadcrumbs.length - 1;

                    return (
                      <React.Fragment key={breadcrumb.path}>
                        <BreadcrumbItem
                          className={index === 0 ? "hidden md:block" : ""}
                        >
                          {isLastItem ? (
                            <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={breadcrumb.path}>
                                {breadcrumb.label}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLastItem && (
                          <BreadcrumbSeparator
                            className={index === 0 ? "hidden md:block" : ""}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 mt-14 w-full">
            <div className="h-full w-full">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
