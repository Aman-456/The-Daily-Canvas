import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CacheManagerClient } from "./CacheManagerClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function CachePage() {
    const session = await auth();

    // Strictly restrict to Admins since revalidating caches is a globally destructive action
    if (!isAdmin(session?.user?.role)) {
        return <AccessDenied requiredPermission="canManageUsers" />; 
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Cache manager"
                description="Force revalidation of static content and highly cached API endpoints."
            />
            <CacheManagerClient />
        </div>
    );
}
