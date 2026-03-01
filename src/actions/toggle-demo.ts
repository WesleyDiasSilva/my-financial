"use server";

import { cookies } from "next/headers";

/**
 * Toggles the admin demo mode on or off by setting a server-side cookie.
 */
export async function toggleAdminDemoMode(enabled: boolean) {
    const cookieStore = await cookies();
    if (enabled) {
        cookieStore.set("admin_demo_mode", "true", {
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });
    } else {
        cookieStore.delete("admin_demo_mode");
    }
}
