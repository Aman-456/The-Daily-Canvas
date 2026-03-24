"use client";

import { LogOut, LayoutDashboard, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { isAdminOrSubAdmin } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserNavProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
		role?: string | null;
	};
}

export function UserNav({ user }: UserNavProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-10 w-10 rounded-full"
				>
					<Avatar className="h-10 w-10 border border-muted-foreground/20">
						<AvatarImage src={user.image || ""} alt={user.name || "User"} />
						<AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.name}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					{isAdminOrSubAdmin(user.role) && (
						<Link href="/admin">
							<DropdownMenuItem className="cursor-pointer">
								<LayoutDashboard className="mr-2 h-4 w-4" />
								<span>Dashboard</span>
							</DropdownMenuItem>
						</Link>
					)}
				</DropdownMenuGroup>

				{isAdminOrSubAdmin(user.role) ? (
					<DropdownMenuSeparator />
				) : null}

				<DropdownMenuItem
					className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
					onClick={() => signOut()}
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
