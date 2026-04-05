"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchInput({
	defaultValue,
	variant = "default",
}: {
	defaultValue: string;
	variant?: "default" | "editorial";
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const query = formData.get("search") as string;

		const params = new URLSearchParams(searchParams.toString());

		if (query && query.trim().length > 0) {
			params.set("search", query);
		} else {
			params.delete("search");
		}

		params.delete("page");

		const qs = params.toString();
		let base = "/";
		if (
			pathname.startsWith("/topics/") &&
			pathname.length > "/topics/".length
		) {
			base = pathname;
		} else if (pathname === "/archive") {
			base = "/archive";
		}
		router.push(qs ? `${base}?${qs}` : base);
	};

	if (variant === "editorial") {
		return (
			<form
				onSubmit={handleSearch}
				className="relative w-full"
			>
				<Search
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<input
					type="search"
					name="search"
					defaultValue={defaultValue}
					placeholder="Search curated stories…"
					className="h-10 w-full rounded-xl border-0 bg-muted/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-muted/50"
				/>
			</form>
		);
	}

	return (
		<form onSubmit={handleSearch} className="relative flex w-full md:w-auto">
			<input
				type="search"
				name="search"
				defaultValue={defaultValue}
				placeholder="Search blogs..."
				className="h-10 w-full rounded-full border border-border bg-background px-4 md:w-[300px] focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
		</form>
	);
}
