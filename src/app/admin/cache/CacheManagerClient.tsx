"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAppCache } from "@/actions/cache";
import { toast } from "sonner";
import { Loader2, RefreshCw, Globe, FileText, MessageSquare, Users, Files, Database, Mail, LayoutDashboard } from "lucide-react";

export function CacheManagerClient() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleClear = async (type: string, name: string) => {
        setLoading(type);
        try {
            const result = await clearAppCache(type as any);
            if (result.success) {
                toast.success(`${name} cleared successfully!`);
            } else {
                toast.error(`Failed to clear ${name}: ${result.error}`);
            }
        } catch (e) {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(null);
        }
    };

    const caches = [
        { id: 'homepage', name: 'Homepage Cache', description: 'Clear the main landing page, forcing a rebuild of the public UI.', icon: Globe },
        { id: 'blogs', name: 'Blogs API Cache', description: 'Clear blogs list from the cache. Affects Public and Admin fetching.', icon: FileText },
        { id: 'comments', name: 'Comments Cache', description: 'Clear all comments lists. Affects articles and moderation.', icon: MessageSquare },
        { id: 'users', name: 'Users Cache', description: 'Clear roles, profiles, and statistics from the user cache.', icon: Users },
        { id: 'pages', name: 'Static Pages Cache', description: 'Clear dynamic pages (Privacy Policy, Terms of Service).', icon: Files },
        { id: 'newsletter', name: 'Newsletter list cache', description: 'Refresh admin newsletter subscriber list from the database.', icon: Mail },
        { id: 'stats', name: 'Dashboard stats cache', description: 'Invalidate user / blog / comment counts on the admin dashboard.', icon: LayoutDashboard },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full border-red-100 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Database className="h-5 w-5" /> Flush All Caches
                    </CardTitle>
                    <CardDescription>
                        Forces a complete revalidation of all cached Server Actions and static ISR pages across the site.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        variant="destructive" 
                        onClick={() => handleClear('all', 'All Caches')}
                        disabled={loading !== null}
                    >
                        {loading === 'all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Purge Everything
                    </Button>
                </CardContent>
            </Card>

            {caches.map((cache) => {
                const Icon = cache.icon;
                return (
                    <Card key={cache.id}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Icon className="h-5 w-5 text-muted-foreground" /> {cache.name}
                            </CardTitle>
                            <CardDescription className="h-10">{cache.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={() => handleClear(cache.id, cache.name)}
                                disabled={loading !== null}
                                className="w-full mt-4"
                            >
                                {loading === cache.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Clear Cache
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
