"use client";

import Link from "next/link";
import {
	Menu,
	X,
	LayoutDashboard,
	FileText,
	MessageSquare,
	Users,
	User,
	Files,
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Database,
	Mail,
	Send,
	ShieldAlert,
	type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isAdmin, hasPermission, cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/client/UserNav";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

/** Matches aside shell so the footer reads as docked when nav scrolls. */
const sidebarFooterBg =
	"bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50";

type NavItem = {
	name: string;
	href: string;
	icon: LucideIcon;
	show: boolean;
};

type NavGroupDef = {
	id: string;
	label: string;
	items: NavItem[];
};

function itemActive(pathname: string, href: string): boolean {
	if (href === "/admin") {
		return pathname === "/admin";
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActiveItem(items: NavItem[], pathname: string): boolean {
	return items.some((i) => i.show && itemActive(pathname, i.href));
}

export function AdminSidebar({ user }: { user: any }) {
	const role = user?.role || "USER";
	const [open, setOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const pathname = usePathname();

	const dashboardItem: NavItem = useMemo(
		() => ({
			name: "Dashboard",
			href: "/admin",
			icon: LayoutDashboard,
			show: isAdmin(role) || hasPermission(user, PERMISSIONS.SEE_STATS),
		}),
		[role, user],
	);

	const navGroups: NavGroupDef[] = useMemo(
		() => [
			{
				id: "content",
				label: "Content",
				items: [
					{
						name: "Blogs",
						href: "/admin/blogs",
						icon: FileText,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_BLOGS),
					},
					{
						name: "Comments",
						href: "/admin/comments",
						icon: MessageSquare,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_COMMENTS),
					},
					{
						name: "Moderation",
						href: "/admin/moderation",
						icon: ShieldAlert,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_COMMENTS),
					},
				],
			},
			{
				id: "audience",
				label: "Audience",
				items: [
					{
						name: "Profile",
						href: "/admin/profile",
						icon: User,
						show: true,
					},
					{
						name: "Users",
						href: "/admin/users",
						icon: Users,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_USERS),
					},
					{
						name: "Newsletter",
						href: "/admin/newsletter",
						icon: Mail,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_USERS),
					},
				],
			},
			{
				id: "site",
				label: "Site & legal",
				items: [
					{
						name: "Pages",
						href: "/admin/pages",
						icon: Files,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_PAGES),
					},
					{
						name: "Contact",
						href: "/admin/contact",
						icon: Send,
						show: isAdmin(role) || hasPermission(user, PERMISSIONS.MANAGE_PAGES),
					},
				],
			},
			{
				id: "system",
				label: "System",
				items: [
					{
						name: "Caches",
						href: "/admin/cache",
						icon: Database,
						show: isAdmin(role),
					},
				],
			},
		],
		[role, user],
	);

	const visibleGroups = useMemo(
		() =>
			navGroups
				.map((g) => ({
					...g,
					items: g.items.filter((i) => i.show),
				}))
				.filter((g) => g.items.length > 0),
		[navGroups],
	);

	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

	/** `undefined` / `true` = expanded; `false` = collapsed */
	const isGroupOpen = (id: string) => openGroups[id] !== false;

	useEffect(() => {
		setOpenGroups((prev) => {
			const next = { ...prev };
			for (const g of visibleGroups) {
				if (groupHasActiveItem(g.items, pathname)) {
					next[g.id] = true;
				}
			}
			return next;
		});
	}, [pathname, visibleGroups]);

	const toggleGroup = (id: string) => {
		setOpenGroups((p) => {
			const open = p[id] !== false;
			return { ...p, [id]: !open };
		});
	};

	const NavItemRow = ({
		item,
		minimized,
		mobile,
		nested,
	}: {
		item: NavItem;
		minimized?: boolean;
		mobile?: boolean;
		nested?: boolean;
	}) => {
		if (!item.show) return null;
		const Icon = item.icon;
		const isActive = itemActive(pathname, item.href);
		const base =
			mobile || !minimized
				? mobile
					? "flex items-center p-3 text-base font-medium rounded-xl transition-all duration-200"
					: cn(
							"group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200",
							nested ? "p-2.5 pl-3" : "p-3",
						)
				: "group relative flex items-center justify-center p-3 rounded-xl transition-all duration-200";

		return (
			<Link
				href={item.href}
				onClick={() => setOpen(false)}
				className={cn(
					base,
					isActive
						? "bg-primary text-primary-foreground shadow-md dark:shadow-none"
						: "text-muted-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-foreground",
				)}
			>
				<Icon
					size={20}
					className={cn(
						"shrink-0",
						!minimized && !mobile && "mr-3",
						minimized && "mx-auto",
						mobile && "mr-3",
					)}
				/>
				{!minimized && !mobile && <span>{item.name}</span>}
				{mobile && <span>{item.name}</span>}
				{minimized && (
					<div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
						{item.name}
					</div>
				)}
			</Link>
		);
	};

	const DesktopNav = () => (
		<div className="flex flex-col gap-3">
			{dashboardItem.show ? (
				<div>
					<NavItemRow item={dashboardItem} minimized={isMinimized} />
				</div>
			) : null}

			{isMinimized ? (
				<div className="flex flex-col gap-1">
					{visibleGroups.map((g) => (
						<div key={g.id} className="flex flex-col gap-1 border-t border-border/40 pt-2 first:border-t-0 first:pt-0">
							{g.items.map((item) => (
								<NavItemRow key={item.href} item={item} minimized />
							))}
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{visibleGroups.map((g) => {
						const isOpen = isGroupOpen(g.id);
						return (
							<div key={g.id} className="rounded-xl border border-border/50 bg-muted/20 dark:bg-muted/10">
								<button
									type="button"
									onClick={() => toggleGroup(g.id)}
									className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
									aria-expanded={isOpen}
								>
									<span>{g.label}</span>
									<ChevronDown
										className={cn(
											"size-4 shrink-0 opacity-70 transition-transform duration-200",
											isOpen ? "rotate-180" : "rotate-0",
										)}
										aria-hidden
									/>
								</button>
								{isOpen ? (
									<div className="flex flex-col gap-0.5 border-t border-border/40 px-2 pb-2 pt-1">
										{g.items.map((item) => (
											<NavItemRow key={item.href} item={item} nested />
										))}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);

	const MobileNav = () => (
		<div className="flex flex-col gap-4">
			{dashboardItem.show ? (
				<div>
					<p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
						Overview
					</p>
					<NavItemRow item={dashboardItem} mobile />
				</div>
			) : null}

			{visibleGroups.map((g) => {
				const isOpen = isGroupOpen(g.id);
				return (
					<div key={g.id}>
						<button
							type="button"
							onClick={() => toggleGroup(g.id)}
							className="mb-2 flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
							aria-expanded={isOpen}
						>
							<span>{g.label}</span>
							<ChevronDown
								className={cn(
									"size-4 shrink-0 transition-transform duration-200",
									isOpen ? "rotate-180" : "rotate-0",
								)}
							/>
						</button>
						{isOpen ? (
							<div className="flex flex-col gap-1 pl-1">
								{g.items.map((item) => (
									<NavItemRow key={item.href} item={item} mobile />
								))}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);

	const BackToSiteLinkDesktop = () => (
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
	);

	return (
		<>
			{/* Mobile Topbar */}
			<div className="md:hidden flex items-center justify-between bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 p-4 shrink-0 sticky top-0 z-50 shadow-sm w-full">
				<h2 className="font-bold text-lg text-foreground tracking-tight">
					Daily<span className="text-primary">.</span>
				</h2>
				<div className="flex items-center gap-2">
					<ThemeToggle />
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
				<div className="md:hidden fixed inset-x-0 top-[69px] bottom-0 z-50 flex flex-col bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-xl border-t border-gray-200 dark:border-zinc-800 slide-in-from-top-2 animate-in duration-200">
					<nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 flex flex-col">
						<MobileNav />
					</nav>
					<div className="sticky bottom-0 shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 px-6 py-4 backdrop-blur-md">
						<Link
							href="/"
							onClick={() => setOpen(false)}
							className="flex items-center p-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
						>
							<ArrowLeft size={20} className="mr-3 shrink-0" />
							<span>Back to Site</span>
						</Link>
					</div>
				</div>
			)}

			{/* Desktop Sidebar */}
			<aside
				className={`hidden md:flex flex-col shrink-0 sticky top-0 h-dvh max-h-dvh self-start bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-r border-gray-200/50 dark:border-zinc-800/50 p-4 shadow-sm transition-all duration-300 ease-in-out z-40 ${isMinimized ? "w-[80px]" : "w-[260px]"
					}`}
			>
				<button
					type="button"
					onClick={() => setIsMinimized(!isMinimized)}
					className="absolute -right-3 top-6 bg-white dark:bg-zinc-800 border-2 border-gray-100 dark:border-zinc-700/50 rounded-full p-1 shadow-sm hover:shadow-md transition-all duration-200 z-50 text-muted-foreground hover:text-foreground flex items-center justify-center hover:scale-110"
					aria-label={isMinimized ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isMinimized ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
				</button>

				<div
					className={`shrink-0 flex items-center min-h-[40px] mb-4 mt-2 transition-all duration-300 ${isMinimized ? "justify-center" : "px-2"
						}`}
				>
					{!isMinimized ? (
						<h2 className="text-2xl font-black tracking-tighter bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
							Workspace<span className="text-primary">.</span>
						</h2>
					) : (
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<span className="font-black text-primary text-xl">W</span>
						</div>
					)}
				</div>

				<nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain pt-1">
					<DesktopNav />
				</nav>

				<div
					className={`sticky bottom-0 z-10 mt-2 shrink-0 border-t border-gray-200 dark:border-zinc-800 pt-4 ${sidebarFooterBg} -mx-4 -mb-4 px-4 pb-4`}
				>
					<BackToSiteLinkDesktop />
				</div>
			</aside>
		</>
	);
}
