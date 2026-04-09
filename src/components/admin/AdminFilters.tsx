"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Option = { value: string; label: string };

export function AdminFilters({
	filters,
	className,
}: {
	filters: Array<{
		key: string;
		label: string;
		options: Option[];
		defaultValue: string;
	}>;
	className?: string;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	function setParam(key: string, value: string, defaultValue: string) {
		const params = new URLSearchParams(searchParams.toString());

		if (!value || value === defaultValue) params.delete(key);
		else params.set(key, value);

		params.set("page", "1");
		startTransition(() => router.push(`${pathname}?${params.toString()}`));
	}

	return (
		<div
			className={
				className ??
				"flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3"
			}
		>
			{filters.map((f) => {
				const current = searchParams.get(f.key) ?? f.defaultValue;
				return (
					<label
						key={f.key}
						className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm sm:min-w-38 sm:flex-none sm:flex-row sm:items-center sm:gap-2"
					>
						<span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
							{f.label}
						</span>
						<select
							className="h-9 w-full min-w-0 rounded-md border border-border/60 bg-background px-3 text-sm shadow-sm sm:w-auto sm:min-w-38"
							value={current}
							onChange={(e) => setParam(f.key, e.target.value, f.defaultValue)}
						>
							{f.options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</label>
				);
			})}
		</div>
	);
}

