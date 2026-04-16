"use client";

import { useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
	label: string;
	onReport: (payload: { reason: string; details?: string }) => Promise<{
		success: boolean;
		error?: string;
		data?: { hidden: boolean; reportsCount: number };
	}>;
	className?: string;
	/** Icon-only control (e.g. under a vertical vote rail). */
	variant?: "default" | "icon" | "chip";
};

export function ReportButton({ label, onReport, className, variant = "default" }: Props) {
	const [pending, start] = useTransition();

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => {
				const reason =
					(window.prompt("Report reason (e.g. spam, abuse, other):", "spam") ||
						"")
						.trim() || "other";
				const details =
					(window.prompt("Optional details (can be blank):", "") || "").trim();
				start(async () => {
					const res = await onReport({ reason, details });
					if (!res.success) {
						toast.error(res.error || "Could not submit report");
						return;
					}
					const count = res.data?.reportsCount ?? 0;
					if (res.data?.hidden) {
						toast.success(`Reported. Auto-hidden at ${count} reports.`);
					} else {
						toast.success(`Reported. (${count} open reports)`);
					}
				});
			}}
			className={cn(
				variant === "icon"
					? "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					: variant === "chip"
						? "inline-flex h-7 items-center gap-1.5 rounded-full bg-muted/60 px-2.5 text-xs font-medium text-muted-foreground shadow-none ring-1 ring-border/40 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:shrink-0"
						: "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-60",
				className,
			)}
			aria-label={variant === "icon" ? label : undefined}
		>
			<Flag
				className={
					variant === "icon"
						? "h-3.5 w-3.5"
						: variant === "chip"
							? "h-3.5 w-3.5 shrink-0"
							: "h-3.5 w-3.5"
				}
				aria-hidden
			/>
			{variant === "default" ? (
				label
			) : variant === "chip" ? (
				label
			) : (
				<span className="sr-only">{label}</span>
			)}
		</button>
	);
}

