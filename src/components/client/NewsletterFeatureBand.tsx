"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter-subscribe";

export function NewsletterFeatureBand() {
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
		<section
			id="newsletter"
			className="scroll-mt-28 rounded-3xl bg-foreground px-8 py-14 text-background md:px-16 md:py-20"
			aria-label="Newsletter"
		>
			<div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
				<div className="flex-1 space-y-5 text-center md:text-left">
					<h2 className="font-headline text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl">
						Stay inspired.
						<br />
						Delivered weekly.
					</h2>
					<p className="text-lg leading-relaxed text-background/65">
						Get our best stories and ideas in your inbox — no noise, just
						thoughtful reading.
					</p>
				</div>
				<div className="w-full max-w-md flex-1">
					<form onSubmit={onSubmit} className="flex flex-col gap-4">
						<Input
							type="email"
							name="email"
							autoComplete="email"
							placeholder="email@address.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-12 rounded-xl border border-background/45 bg-background/15 px-5 text-background placeholder:text-background/50 focus-visible:border-background/70 focus-visible:ring-background/25"
						/>
						<Button
							type="submit"
							size="lg"
							disabled={loading}
							className="font-headline h-12 rounded-xl font-bold"
						>
							{loading ? "…" : "Join the list"}
						</Button>
					</form>
				</div>
			</div>
		</section>
	);
}
