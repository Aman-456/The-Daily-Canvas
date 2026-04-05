"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContactMessage, type ContactFormState } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initial: ContactFormState = { success: false, error: null };

type ContactFormProps = {
	identityLocked?: boolean;
	prefilledName?: string;
	prefilledEmail?: string;
};

export function ContactForm({
	identityLocked = false,
	prefilledName = "",
	prefilledEmail = "",
}: ContactFormProps) {
	const [state, formAction, pending] = useActionState(
		submitContactMessage,
		initial,
	);
	const statusRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!state.success) return;
		const el = statusRef.current;
		if (!el) return;
		queueMicrotask(() => {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			el.focus({ preventScroll: true });
		});
	}, [state.success]);

	if (state.success) {
		return (
			<div
				ref={statusRef}
				tabIndex={-1}
				className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:bg-muted/10"
				role="status"
				aria-live="polite"
			>
				<p className="font-semibold text-foreground">Message sent</p>
				<p className="mt-2 text-sm text-muted-foreground">
					Thanks — we&apos;ll get back to you if a reply is needed.
				</p>
			</div>
		);
	}

	return (
		<form action={formAction} className="space-y-6">
			{state.error ? (
				<p className="text-sm font-medium text-destructive" role="alert">
					{state.error}
				</p>
			) : null}

			<div className="space-y-2">
				<Label htmlFor="contact-name">Name</Label>
				<Input
					id="contact-name"
					name="name"
					type="text"
					autoComplete="name"
					required
					maxLength={120}
					defaultValue={prefilledName}
					readOnly={identityLocked}
					placeholder="Your name"
					className={cn(
						identityLocked && "cursor-not-allowed bg-muted/60 dark:bg-muted/30",
					)}
					aria-readonly={identityLocked || undefined}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-email">Email</Label>
				<Input
					id="contact-email"
					name="email"
					type="email"
					autoComplete="email"
					required
					maxLength={254}
					defaultValue={prefilledEmail}
					readOnly={identityLocked}
					placeholder="you@example.com"
					className={cn(
						identityLocked && "cursor-not-allowed bg-muted/60 dark:bg-muted/30",
					)}
					aria-readonly={identityLocked || undefined}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-message">Message</Label>
				<Textarea
					id="contact-message"
					name="message"
					required
					rows={6}
					maxLength={5000}
					placeholder="How can we help?"
					className="min-h-[140px] resize-y"
				/>
			</div>

			<Button type="submit" disabled={pending} className="w-full sm:w-auto">
				{pending ? "Sending…" : "Send message"}
			</Button>
		</form>
	);
}
