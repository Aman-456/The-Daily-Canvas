"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchInput({
	defaultValue,
}: {
	defaultValue: string;
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
		const base =
			pathname.startsWith("/topics/") && pathname.length > "/topics/".length
				? pathname
				: "/";
		router.push(qs ? `${base}?${qs}` : base);
	};

	return (
		<form onSubmit={handleSearch} className="flex w-full md:w-auto relative">
			<input
				type="search"
				name="search"
				defaultValue={defaultValue}
				placeholder="Search blogs..."
				className="w-full md:w-[300px] h-10 px-4 rounded-full border border-gray-300 dark:border-zinc-700 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
		</form>
	);
}
