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
		<div className={className ?? "flex items-center gap-3 flex-wrap"}>
			{filters.map((f) => {
				const current = searchParams.get(f.key) ?? f.defaultValue;
				return (
					<label key={f.key} className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground font-medium">{f.label}</span>
						<select
							className="h-9 rounded-md border bg-white dark:bg-zinc-900 px-3 text-sm shadow-sm"
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

