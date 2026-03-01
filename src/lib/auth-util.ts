import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// The email of the demo user account
export const DEMO_USER_EMAIL = "demo@mylife.com";

/**
 * Gets the actual OR effective user ID for the current request.
 * If the user is an Admin AND the 'admin_demo_mode' cookie is true,
 * it returns the ID of the Demo User instead of the Admin's ID.
 */
export async function getEffectiveUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const user = session.user as any;

    // Only attempt interception if the logged-in user is actually an admin
    if (user.isAdmin) {
        const cookieStore = await cookies();
        const demoMode = cookieStore.get("admin_demo_mode")?.value === "true";

        if (demoMode) {
            // Find the demo user ID
            const demoUser = await prisma.user.findUnique({
                where: { email: DEMO_USER_EMAIL },
                select: { id: true }
            });

            if (demoUser) {
                return demoUser.id;
            }
        }
    }

    // Default: return the real logged-in user's ID
    return session.user.id;
}
