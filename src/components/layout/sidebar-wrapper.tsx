"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "./sidebar";

export function SidebarWrapper() {
    const pathname = usePathname();

    const hideSidebar = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/pricing", "/about"];

    if (hideSidebar.includes(pathname)) {
        return null;
    }

    return (
        <Suspense fallback={<div className="w-72 bg-zinc-950 h-screen border-r border-zinc-900" />}>
            <Sidebar />
        </Suspense>
    );
}
