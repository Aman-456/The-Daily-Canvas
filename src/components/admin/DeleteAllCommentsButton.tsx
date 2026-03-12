"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAllCommentsForBlog } from "@/actions/comment";
import { useRouter } from "next/navigation";

interface DeleteAllCommentsButtonProps {
	blogId: string;
	slug: string;
	onSuccess?: () => void;
}

export function DeleteAllCommentsButton({
	blogId,
	slug,
	onSuccess,
}: DeleteAllCommentsButtonProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleDeleteAll = () => {
		if (
			!confirm(
				"Are you absolutely sure? This will permanently delete ALL comments and replies for this blog post. This action cannot be undone.",
			)
		) {
			return;
		}

		startTransition(async () => {
			try {
				const result = await deleteAllCommentsForBlog(blogId, slug);
				if (result.success) {
					toast.success("All comments deleted successfully");
					router.refresh();
					if (onSuccess) onSuccess();
				} else {
					toast.error(result.error || "Failed to delete comments");
				}
			} catch (error) {
				toast.error("An unexpected error occurred");
			}
		});
	};

	return (
		<Button
			variant="destructive"
			size="sm"
			className="gap-2 cursor-pointer"
			onClick={handleDeleteAll}
			disabled={isPending}
		>
			<Trash2 className="h-4 w-4" />
			{isPending ? "Deleting..." : "Delete All Comments"}
		</Button>
	);
}
