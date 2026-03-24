"use client";

import { useState } from "react";
import { toggleUserRole } from "@/actions/user";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
	userId: string;
	currentRole: "USER" | "ADMIN";
	disabled?: boolean;
}

export function UserRoleSelect({ userId, currentRole, disabled }: Props) {
	const [loading, setLoading] = useState(false);

	const handleRoleChange = async (newRole: "USER" | "ADMIN") => {
		if (newRole === currentRole) return;
		setLoading(true);
		try {
			const result = await toggleUserRole(userId, newRole);
			if (result.success) {
				toast.success(`Role updated to ${newRole}`);
			} else {
				toast.error(result.error || "Failed to update role");
			}
		} catch (error: any) {
			toast.error("An unexpected error occurred while updating the role");
		} finally {
			setLoading(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={disabled || loading}>
					{currentRole}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => handleRoleChange("USER")}>
					USER
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>
					ADMIN
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
