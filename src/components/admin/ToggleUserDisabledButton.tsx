"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserDisabled } from "@/actions/user";

export function ToggleUserDisabledButton({
	userId,
	isDisabled,
}: {
	userId: string;
	isDisabled: boolean;
}) {
	const [pending, startTransition] = useTransition();

	return (
		<Button
			variant={isDisabled ? "secondary" : "outline"}
			size="xs"
			disabled={pending}
			onClick={() =>
				startTransition(async () => {
					await toggleUserDisabled(userId);
				})
			}
		>
			{isDisabled ? "Enable" : "Disable"}
		</Button>
	);
}

