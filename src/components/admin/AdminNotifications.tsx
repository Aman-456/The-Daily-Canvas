"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notification";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AdminNotifications() {
	const [notifications, setNotifications] = useState<any[]>([]);
	const unreadCount = notifications.filter(n => !n.isRead).length;

	useEffect(() => {
		const load = async () => {
			const res = await getNotifications();
			if (res.success && res.data) {
				setNotifications(res.data);
			}
		};
		load();
		const interval = setInterval(load, 30000); // 30 seconds
		return () => clearInterval(interval);
	}, []);

	const handleRead = async (id: string, isRead: boolean) => {
		if (isRead) return;
		await markNotificationAsRead(id);
		setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
	};

	const handleReadAll = async () => {
		await markAllNotificationsAsRead();
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative text-foreground shrink-0">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="absolute top-1 right-2 h-2 w-2 bg-red-500 rounded-full" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80" align="end">
				<DropdownMenuLabel className="flex items-center justify-between">
					<span>Notifications</span>
					{unreadCount > 0 && (
						<Button variant="ghost" size="sm" onClick={handleReadAll} className="text-xs h-auto p-0 text-primary">
							Mark all read
						</Button>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{notifications.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
				) : (
					<div className="max-h-80 overflow-y-auto w-full">
						{notifications.map((n) => (
							<div key={n._id} className={`p-4 border-b last:border-0 transition-colors ${n.isRead ? "bg-white dark:bg-zinc-950 opacity-80" : "bg-blue-50/50 dark:bg-blue-900/10"}`}>
								<p className={`text-sm mb-3 ${n.isRead ? "text-muted-foreground" : "text-foreground font-semibold"}`}>{n.message}</p>
								<div className="flex gap-3 text-xs font-bold">
									<Link href={n.link} onClick={() => handleRead(n._id, n.isRead)} className={`hover:underline ${n.isRead ? "text-muted-foreground/60" : "text-primary"}`}>
										View in Comments
									</Link>
									<span className="text-muted-foreground/40">•</span>
									<Link href={n.blogLink} onClick={() => handleRead(n._id, n.isRead)} className={`hover:underline ${n.isRead ? "text-muted-foreground/60" : "text-primary"}`}>
										Go to Blog
									</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
