"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter-subscribe";

export function NewsletterSignup() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			toast.error("Please enter a valid email address.");
			return;
		}
		setLoading(true);
		try {
			const result = await subscribeNewsletter(trimmed);
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			if (result.alreadySubscribed) {
				toast.success("You’re already subscribed — thanks for staying with us.");
			} else {
				toast.success("Thanks — you’re on the list. We’ll be in touch soon.");
			}
			setEmail("");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md mx-auto rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/15 px-5 py-5 text-center">
			<p className="text-sm font-semibold text-foreground">Newsletter</p>
			<p className="text-xs text-muted-foreground mt-1 mb-4">
				Get new stories in your inbox. No spam — unsubscribe anytime.
			</p>
			<form
				onSubmit={onSubmit}
				className="flex flex-col sm:flex-row gap-2 justify-center"
			>
				<Input
					type="email"
					name="email"
					autoComplete="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="h-9 bg-background text-sm"
				/>
				<Button type="submit" size="sm" disabled={loading} className="shrink-0">
					{loading ? "…" : "Subscribe"}
				</Button>
			</form>
		</div>
	);
}
