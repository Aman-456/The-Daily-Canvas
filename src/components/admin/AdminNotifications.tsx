"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
	getNotifications,
	getUnreadNotificationsCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
} from "@/actions/notification";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Notification } from "@/db/schema";

export function AdminNotifications() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [open, setOpen] = useState(false);
	const hasLoadedListRef = useRef(false);

	useEffect(() => {
		let alive = true;

		const loadCount = async () => {
			const res = await getUnreadNotificationsCount();
			if (!alive) return;
			if (res.success) setUnreadCount(res.data);
		};

		// Load a cheap unread count on mount
		loadCount();

		// Refresh count on tab focus (no background polling)
		const onVisibility = () => {
			if (document.visibilityState === "visible") {
				loadCount();
			}
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			alive = false;
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	useEffect(() => {
		if (!open) return;

		let alive = true;
		const loadList = async () => {
			const res = await getNotifications();
			if (!alive) return;
			if (res.success && res.data) {
				setNotifications(res.data);
				setUnreadCount(res.data.filter((n) => !n.isRead).length);
				hasLoadedListRef.current = true;
			}
		};

		// Load list only when dropdown is opened
		loadList();

		// While open, poll occasionally (keeps it fresh without constant background load)
		const interval = setInterval(() => {
			if (document.visibilityState !== "visible") return;
			loadList();
		}, 30000);

		return () => {
			alive = false;
			clearInterval(interval);
		};
	}, [open]);

	const handleRead = async (id: string, isRead: boolean) => {
		if (isRead) return;
		const res = await markNotificationAsRead(id);
		if (!res.success) return;
		setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
		setUnreadCount((c) => Math.max(0, c - 1));
	};

	const handleReadAll = async () => {
		const res = await markAllNotificationsAsRead();
		if (!res.success) return;
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
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
					<div className="p-4 text-center text-sm text-muted-foreground">
						{hasLoadedListRef.current ? "No new notifications" : "Open to load notifications"}
					</div>
				) : (
					<div className="max-h-80 overflow-y-auto w-full">
						{notifications.map((n) => (
							<div key={n.id} className={`p-4 border-b last:border-0 transition-colors ${n.isRead ? "bg-white dark:bg-zinc-950 opacity-80" : "bg-blue-50/50 dark:bg-blue-900/10"}`}>
								<p className={`text-sm mb-3 ${n.isRead ? "text-muted-foreground" : "text-foreground font-semibold"}`}>{n.message}</p>
								<div className="flex gap-3 text-xs font-bold">
									<Link href={n.link} onClick={() => handleRead(n.id, n.isRead)} className={`hover:underline ${n.isRead ? "text-muted-foreground/60" : "text-primary"}`}>
										View in Comments
									</Link>
									<span className="text-muted-foreground/40">•</span>
									<Link href={n.blogLink} onClick={() => handleRead(n.id, n.isRead)} className={`hover:underline ${n.isRead ? "text-muted-foreground/60" : "text-primary"}`}>
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
