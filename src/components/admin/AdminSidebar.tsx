"use client";

import Link from "next/link";
import {
	Menu,
	X,
	LayoutDashboard,
	FileText,
	MessageSquare,
	Users,
	Files,
	ArrowLeft,
	Power,
	ChevronLeft,
	ChevronRight,
	Database,
} from "lucide-react";
import { useState } from "react";
import { isAdmin, hasPermission, } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/client/UserNav";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

export function AdminSidebar({ user }: { user: any }) {
	const role = user?.role || "USER";
	const [open, setOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const pathname = usePathname();

	const navItems = [
		{
			name: "Dashboard",
			href: "/admin",
			icon: LayoutDashboard,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.SEE_STATS)
		},
		{
			name: "Blogs",
			href: "/admin/blogs",
			icon: FileText,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_BLOGS)
		},
		{
			name: "Comments",
			href: "/admin/comments",
			icon: MessageSquare,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_COMMENTS)
		},
		{
			name: "Users",
			href: "/admin/users",
			icon: Users,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_USERS)
		},
		{
			name: "Pages",
			href: "/admin/pages",
			icon: Files,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_PAGES)
		},
		{
			name: "Caches",
			href: "/admin/cache",
			icon: Database,
			show: isAdmin(role)
		},
	];

	const DesktopNavLinks = () => (
		<div className="flex flex-col h-full justify-between">
			<nav className="flex flex-col space-y-2 mt-4">
				{navItems
					.filter((item) => item.show)
					.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setOpen(false)}
								className={`group relative flex items-center p-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
									? "bg-primary text-primary-foreground shadow-md dark:shadow-none"
									: "text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-foreground"
									}`}
							>
								<Icon
									size={20}
									className={`${isMinimized ? "mx-auto" : "mr-3"} shrink-0`}
								/>
								{!isMinimized && <span>{item.name}</span>}

								{isMinimized && (
									<div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
										{item.name}
									</div>
								)}
							</Link>
						);
					})}
			</nav>

			<div className="mt-8 pt-4 border-t border-gray-200 dark:border-zinc-800">
				<Link
					href="/"
					className="group relative flex items-center p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
				>
					<ArrowLeft
						size={20}
						className={`${isMinimized ? "mx-auto" : "mr-3"} shrink-0`}
					/>
					{!isMinimized && <span>Back to Site</span>}

					{isMinimized && (
						<div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
							Back to Site
						</div>
					)}
				</Link>
			</div>
		</div>
	);

	const MobileNavLinks = () => (
		<nav className="flex flex-col space-y-2">
			{navItems
				.filter((item) => item.show)
				.map((item) => {
					const Icon = item.icon;
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setOpen(false)}
							className={`flex items-center p-3 text-base font-medium rounded-xl transition-all duration-200 ${isActive
								? "bg-primary text-primary-foreground shadow-md dark:shadow-none"
								: "text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-foreground"
								}`}
						>
							<Icon size={20} className="mr-3 shrink-0" />
							<span>{item.name}</span>
						</Link>
					);
				})}
			<div className="pt-6 mt-6 border-t border-gray-200 dark:border-zinc-800">
				<Link
					href="/"
					onClick={() => setOpen(false)}
					className="flex items-center p-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
				>
					<ArrowLeft size={20} className="mr-3 shrink-0" />
					<span>Back to Site</span>
				</Link>
			</div>
		</nav>
	);

	return (
		<>
			{/* Mobile Topbar */}
			<div className="md:hidden flex items-center justify-between bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 p-4 shrink-0 sticky top-0 z-50 shadow-sm w-full">
				<h2 className="font-bold text-lg text-foreground tracking-tight">
					Daily<span className="text-primary">.</span>
				</h2>
				<div className="flex items-center gap-3">
					<AdminNotifications />
					<UserNav user={user} />
					<button
						onClick={() => setOpen(!open)}
						className="p-2 -mr-2 text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
					>
						{open ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{open && (
				<div className="md:hidden fixed inset-x-0 top-[69px] bottom-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-50 p-6 shadow-xl border-t border-gray-200 dark:border-zinc-800 overflow-y-auto slide-in-from-top-2 animate-in duration-200">
					<MobileNavLinks />
				</div>
			)}

			{/* Desktop Sidebar */}
			<aside
				className={`hidden md:flex flex-col shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-r border-gray-200/50 dark:border-zinc-800/50 p-4 shadow-sm min-h-screen relative transition-all duration-300 ease-in-out z-40 ${isMinimized ? "w-[80px]" : "w-[260px]"
					}`}
			>
				{/* Toggle Switch */}
				<button
					onClick={() => setIsMinimized(!isMinimized)}
					className="absolute -right-3 top-6 bg-white dark:bg-zinc-800 border-2 border-gray-100 dark:border-zinc-700/50 rounded-full p-1 shadow-sm hover:shadow-md transition-all duration-200 z-50 text-muted-foreground hover:text-foreground flex items-center justify-center hover:scale-110"
				>
					{isMinimized ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
				</button>

				<div
					className={`flex items-center min-h-[40px] mb-8 mt-2 transition-all duration-300 ${isMinimized ? "justify-center" : "px-2"
						}`}
				>
					{!isMinimized ? (
						<h2 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
							Workspace<span className="text-primary">.</span>
						</h2>
					) : (
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<span className="font-black text-primary text-xl">W</span>
						</div>
					)}
				</div>

				<DesktopNavLinks />
			</aside>
		</>
	);
}
