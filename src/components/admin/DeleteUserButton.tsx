"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { 
	Dialog, 
	DialogContent, 
	DialogHeader, 
	DialogTitle, 
	DialogFooter,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/actions/user";
import { toast } from "sonner";

interface DeleteUserButtonProps {
	userId: string;
	userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		setLoading(true);
		try {
			const result = await deleteUser(userId);
			if (result.success) {
				toast.success(`User ${userName} deleted successfully`);
                setOpen(false);
			} else {
				toast.error(result.error || "Failed to delete user");
			}
		} catch (error) {
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button 
					variant="ghost" 
					size="sm" 
					className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
				>
					<Trash2 size={16} />
				</Button>
			</DialogTrigger>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<div className="flex items-center gap-2 text-red-600 mb-2">
						<AlertTriangle size={20} />
						<DialogTitle>Delete User</DialogTitle>
					</div>
					<DialogDescription>
						Are you sure you want to delete <strong>{userName}</strong>? 
						This action cannot be undone. Their blogs and comments will remain as from Ref: "Deleted User".
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
					<Button 
						onClick={handleDelete} 
						disabled={loading}
						className="bg-red-600 hover:bg-red-700 text-white"
					>
						{loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
						Delete User
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
