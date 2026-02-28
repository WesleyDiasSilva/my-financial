"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function SidebarWrapper() {
    const pathname = usePathname();

    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    return <Sidebar />;
}
