"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SearchInput({
	defaultValue,
}: {
	defaultValue: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const query = formData.get("search") as string;

		// Create a new URLSearchParams object based on current params
		const params = new URLSearchParams(searchParams.toString());

		if (query && query.trim().length > 0) {
			params.set("search", query);
		} else {
			params.delete("search"); // This removes the key entirely
		}

		// Reset to page 1 on new search
		params.delete("page");

		// Push the new URL
		router.push(`/?${params.toString()}`);
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
