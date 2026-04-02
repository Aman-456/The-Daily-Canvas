"use client";

import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type ProvidersMap = Record<string, { id: string; name: string }> | null;

export default function SignInPage() {
	const [providers, setProviders] = useState<ProvidersMap>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		getProviders()
			.then((p) => {
				if (alive) setProviders(p);
			})
			.catch(() => {
				if (alive) setProviders(null);
			});
		return () => {
			alive = false;
		};
	}, []);

	const hasGoogle = !!providers?.google;
	const hasCredentials = !!providers?.credentials;

	const callbackUrl = useMemo(() => {
		if (typeof window === "undefined") return "/";
		const params = new URLSearchParams(window.location.search);
		return params.get("callbackUrl") || "/admin";
	}, []);

	async function onCredentialsSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);
		try {
			const res = await signIn("credentials", {
				email,
				password,
				callbackUrl,
			});

			// With default redirect behavior, successful sign-in navigates away automatically.
			// If it doesn't navigate (e.g. error), NextAuth may still return a response.
			const maybeRes = res as unknown as { error?: string } | undefined;
			if (maybeRes?.error) {
				setError(
					maybeRes.error === "CredentialsSignin"
						? "Invalid email or password."
						: maybeRes.error,
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md rounded-2xl border bg-background shadow-sm">
				<div className="p-6 sm:p-8 space-y-6">
					<div className="space-y-2">
						<h1 className="text-2xl font-black tracking-tight">Sign in</h1>
						<p className="text-sm text-muted-foreground">
							Continue to the admin panel or post comments.
						</p>
					</div>

					{hasGoogle && (
						<Button
							type="button"
							className="w-full"
							variant="secondary"
							onClick={() => signIn("google", { callbackUrl })}
						>
							Sign in with Google
						</Button>
					)}

					{hasGoogle && hasCredentials && (
						<div className="flex items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs text-muted-foreground font-medium">OR</span>
							<div className="h-px flex-1 bg-border" />
						</div>
					)}

					{hasCredentials ? (
						<form onSubmit={onCredentialsSubmit} className="space-y-4">
							<div className="space-y-2">
								<label className="text-sm font-semibold">Email</label>
								<Input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@example.com"
									autoComplete="email"
									required
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-semibold">Password</label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									autoComplete="current-password"
									required
								/>
							</div>

							{error && (
								<div className="text-sm text-destructive font-medium">{error}</div>
							)}

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Signing in..." : "Sign in"}
							</Button>

							<p className="text-xs text-muted-foreground">
								Credentials sign-in is available only when configured (and may be
								enabled only in development).
							</p>
						</form>
					) : (
						<p className="text-sm text-muted-foreground">
							Credentials sign-in is not enabled. If you are the developer, set
							`DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` in your env.
						</p>
					)}

					<div className="pt-2 text-sm">
						<Link href="/" className="text-primary hover:underline">
							Back to home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

