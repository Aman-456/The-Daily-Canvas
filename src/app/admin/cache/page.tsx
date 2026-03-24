import { auth } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CacheManagerClient } from "./CacheManagerClient";

export default async function CachePage() {
    const session = await auth();

    // Strictly restrict to Admins since revalidating caches is a globally destructive action
    if (!isAdmin(session?.user?.role)) {
        return <AccessDenied requiredPermission="canManageUsers" />; 
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cache Manager</h1>
                <p className="text-muted-foreground">Force revalidation of static content and highly cached API endpoints.</p>
            </div>
            <CacheManagerClient />
        </div>
    );
}
