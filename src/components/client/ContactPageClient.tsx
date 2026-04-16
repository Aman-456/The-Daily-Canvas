"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { FadeIn } from "@/components/client/FadeIn";
import { ContactForm } from "@/components/client/ContactForm";

/** Static marketing copy for /contact (not CMS). */
export function ContactPageClient() {
	const { data: session, status } = useSession();
	const u = session?.user;

	const sessionEmail = u?.email?.trim() ?? null;
	const prefilledName = useMemo(() => {
		if (u?.name?.trim()) return u.name.trim();
		if (sessionEmail) return sessionEmail.split("@")[0] ?? null;
		return null;
	}, [u?.name, sessionEmail]);

	const identityLocked = Boolean(sessionEmail);

	return (
		<div className="container mx-auto max-w-lg space-y-10 py-5 md:py-10">
			<FadeIn>
				<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
					Contact us
				</h1>
				<p className="mt-3 text-muted-foreground">
					{status !== "loading" && identityLocked ? (
						<>
							You&apos;re signed in — your name and email are taken from your account.
							Only your message can be edited below.
						</>
					) : (
						<>
							Use the form below. We read every message; you don&apos;t need an account.
						</>
					)}
				</p>
			</FadeIn>

			<FadeIn>
				<ContactForm
					identityLocked={status !== "loading" && identityLocked}
					prefilledName={prefilledName ?? ""}
					prefilledEmail={sessionEmail ?? ""}
				/>
			</FadeIn>

			<p className="text-sm text-muted-foreground">
				<Link href="/faq" className="font-medium text-primary hover:underline">
					FAQ
				</Link>
				{" · "}
				<Link href="/" className="font-medium text-primary hover:underline">
					Home
				</Link>
			</p>
		</div>
	);
}
