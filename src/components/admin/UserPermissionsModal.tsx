"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Save, Loader2 } from "lucide-react";
import { updateUserPermissions } from "@/actions/permissions";
import { PERMISSIONS } from "@/lib/constants";

interface Props {
	user: any;
}

export function UserPermissionsModal({ user }: Props) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [permissions, setPermissions] = useState(
		user.permissions || {
			[PERMISSIONS.SEE_STATS]: false,

			[PERMISSIONS.MANAGE_BLOGS]: false,
			[PERMISSIONS.MANAGE_COMMENTS]: false,
			[PERMISSIONS.MANAGE_PAGES]: false,
			[PERMISSIONS.MANAGE_USERS]: false,
		},
	);

	const handleToggle = (key: string) => {
		setPermissions((prev: any) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			const result = await updateUserPermissions(user._id.toString(), permissions);
			if (result.success) {
				toast.success("Permissions updated successfully");
				setOpen(false);
			} else {
				toast.error(result.error || "Failed to update permissions");
			}
		} catch (error: any) {
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<Shield size={16} className="text-muted-foreground hover:text-primary" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Permissions for {user.name}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<PermissionToggle
						label="Can See Stats"
						description="Allow viewing dashboard statistics"
						checked={permissions[PERMISSIONS.SEE_STATS]}
						onToggle={() => handleToggle(PERMISSIONS.SEE_STATS)}
					/>

					<PermissionToggle
						label="Can Manage Blogs"
						description="Allow managing blogs of other users"
						checked={permissions[PERMISSIONS.MANAGE_BLOGS]}
						onToggle={() => handleToggle(PERMISSIONS.MANAGE_BLOGS)}
					/>
					<PermissionToggle
						label="Can Manage Comments"
						description="Allow managing all comments"
						checked={permissions[PERMISSIONS.MANAGE_COMMENTS]}
						onToggle={() => handleToggle(PERMISSIONS.MANAGE_COMMENTS)}
					/>
					<PermissionToggle
						label="Can Manage Pages"
						description="Allow creating and editing static pages"
						checked={permissions[PERMISSIONS.MANAGE_PAGES]}
						onToggle={() => handleToggle(PERMISSIONS.MANAGE_PAGES)}
					/>
					<PermissionToggle
						label="Can Manage Users"
						description="Allow managing other users and roles"
						checked={permissions[PERMISSIONS.MANAGE_USERS]}
						onToggle={() => handleToggle(PERMISSIONS.MANAGE_USERS)}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={loading}>
						{loading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function PermissionToggle({
	label,
	description,
	checked,
	onToggle,
}: {
	label: string;
	description: string;
	checked: boolean;
	onToggle: () => void;
}) {
	return (
		<div
			className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
			onClick={onToggle}
		>
			<div className="space-y-0.5">
				<p className="text-sm font-medium leading-none">{label}</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
			<div
				className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${
					checked ? "bg-primary" : "bg-muted"
				}`}
			>
				<div
					className={`w-4 h-4 rounded-full bg-white transition-transform ${
						checked ? "translate-x-4" : "translate-x-0"
					}`}
				/>
			</div>
		</div>
	);
}
