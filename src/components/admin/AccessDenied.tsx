import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AccessDeniedProps {
	message?: string;
	requiredPermission?: string;
}

export function AccessDenied({ 
	message = "You don't have the necessary permissions to access this section.",
	requiredPermission 
}: AccessDeniedProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in duration-300">
			<div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
				<ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-500" />
			</div>
			<h1 className="text-3xl font-bold tracking-tight mb-2">Access Restricted</h1>
			<p className="text-muted-foreground max-w-md mb-8">
				{message}
				{requiredPermission && (
					<span className="block mt-2 font-mono text-xs bg-muted p-1 rounded">
						Required: {requiredPermission}
					</span>
				)}
			</p>
			<div className="flex gap-4">
				<Link href="/admin/blogs">
					<Button variant="outline" className="gap-2">
						<ArrowLeft size={16} /> My Blogs
					</Button>
				</Link>
				<Link href="/">
					<Button className="gap-2">
						Go to Homepage
					</Button>
				</Link>
			</div>
			<p className="mt-8 text-sm text-muted-foreground italic">
				If you believe this is an error, please contact your administrator.
			</p>
		</div>
	);
}
