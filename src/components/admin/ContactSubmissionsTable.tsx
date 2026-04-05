"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { updateContactSubmissionStatus } from "@/actions/contact";
import {
	CONTACT_SUBMISSION_STATUSES,
	CONTACT_SUBMISSION_STATUS_LABELS,
	type ContactSubmissionStatus,
	statusBadgeClass,
} from "@/lib/contact-submission-status";
import { cn } from "@/lib/utils";

export type ContactSubmissionRow = {
	id: string;
	name: string;
	email: string;
	message: string;
	status: ContactSubmissionStatus;
	createdAt: string;
};

const PREVIEW_CHARS = 160;
const MAX_PREVIEW_LINES = 3;

function previewMessage(text: string): { text: string; showExpand: boolean } {
	const t = text.trim();
	const lines = t.split("\n");
	const longByChars = t.length > PREVIEW_CHARS;
	const longByLines = lines.length > MAX_PREVIEW_LINES;
	const showExpand = longByChars || longByLines;
	const textForCell = longByChars
		? `${t.slice(0, PREVIEW_CHARS).trim()}…`
		: t;
	return { text: textForCell, showExpand };
}

function formatAt(iso: string) {
	const d = new Date(iso);
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function ContactSubmissionsTable({ rows }: { rows: ContactSubmissionRow[] }) {
	const [active, setActive] = useState<ContactSubmissionRow | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	const onStatusChange = (id: string, next: ContactSubmissionStatus) => {
		startTransition(async () => {
			const res = await updateContactSubmissionStatus(id, next);
			if (res.success) {
				router.refresh();
				setActive((cur) =>
					cur && cur.id === id ? { ...cur, status: next } : cur,
				);
			} else {
				toast.error(res.error ?? "Could not update status");
			}
		});
	};

	return (
		<>
			<div className="rounded-lg border bg-white shadow-sm dark:bg-zinc-900">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[160px]">Received</TableHead>
							<TableHead className="w-[150px]">Status</TableHead>
							<TableHead className="w-[120px]">Name</TableHead>
							<TableHead className="w-[200px]">Email</TableHead>
							<TableHead>Message</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((r) => {
							const { text: preview, showExpand } = previewMessage(r.message);
							return (
								<TableRow key={r.id}>
									<TableCell className="align-top text-muted-foreground text-xs whitespace-nowrap">
										{formatAt(r.createdAt)}
									</TableCell>
									<TableCell className="align-top">
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
											<Badge
												variant="outline"
												className={cn("shrink-0", statusBadgeClass(r.status))}
											>
												{CONTACT_SUBMISSION_STATUS_LABELS[r.status]}
											</Badge>
											<select
												className="h-8 min-w-[8.5rem] rounded-md border border-input bg-background px-2 text-xs"
												value={r.status}
												disabled={pending}
												aria-label={`Status for ${r.name}`}
												onChange={(e) =>
													onStatusChange(
														r.id,
														e.target.value as ContactSubmissionStatus,
													)
												}
											>
												{CONTACT_SUBMISSION_STATUSES.map((s) => (
													<option key={s} value={s}>
														{CONTACT_SUBMISSION_STATUS_LABELS[s]}
													</option>
												))}
											</select>
										</div>
									</TableCell>
									<TableCell className="align-top font-medium">{r.name}</TableCell>
									<TableCell className="align-top">
										<a
											href={`mailto:${encodeURIComponent(r.email)}`}
											className="text-primary hover:underline break-all text-sm"
										>
											{r.email}
										</a>
									</TableCell>
									<TableCell className="align-top max-w-md">
										<p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground break-words">
											{preview}
										</p>
										{showExpand ? (
											<Button
												type="button"
												variant="link"
												className="mt-1 h-auto p-0 text-xs font-semibold"
												onClick={() => setActive(r)}
											>
												View full message
											</Button>
										) : null}
									</TableCell>
								</TableRow>
							);
						})}
						{rows.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
									No messages yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
				<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
					{active ? (
						<>
							<DialogHeader>
								<DialogTitle>Message from {active.name}</DialogTitle>
							</DialogHeader>
							<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<p>
									<a
										href={`mailto:${encodeURIComponent(active.email)}`}
										className="font-medium text-primary hover:underline"
									>
										{active.email}
									</a>
								</p>
								<span className="text-border">·</span>
								<p>{formatAt(active.createdAt)}</p>
								<span className="text-border">·</span>
								<Badge
									variant="outline"
									className={cn(statusBadgeClass(active.status))}
								>
									{CONTACT_SUBMISSION_STATUS_LABELS[active.status]}
								</Badge>
								<select
									className="h-8 min-w-[8.5rem] rounded-md border border-input bg-background px-2 text-xs"
									value={active.status}
									disabled={pending}
									aria-label="Update status"
									onChange={(e) =>
										onStatusChange(
											active.id,
											e.target.value as ContactSubmissionStatus,
										)
									}
								>
									{CONTACT_SUBMISSION_STATUSES.map((s) => (
										<option key={s} value={s}>
											{CONTACT_SUBMISSION_STATUS_LABELS[s]}
										</option>
									))}
								</select>
							</div>
							<div className="mt-3 rounded-md border border-border/60 bg-muted/30 p-4 dark:bg-muted/10">
								<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
									{active.message}
								</p>
							</div>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
