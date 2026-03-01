import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminUsers } from "@/components/admin/admin-users";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(session.user as any).isAdmin) {
        redirect("/dashboard");
    }

    return <AdminUsers />;
}
