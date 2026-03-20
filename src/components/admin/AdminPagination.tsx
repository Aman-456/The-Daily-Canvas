"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

interface AdminPaginationProps {
	totalPages: number;
	currentPage: number;
}

export function AdminPagination({
	totalPages,
	currentPage,
}: AdminPaginationProps) {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const createPageURL = (pageNumber: number | string) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	if (totalPages <= 1) return null;

	return (
		<div className="flex justify-center items-center gap-3 pt-4">
			<p className="text-xs text-muted-foreground mr-4">
				Page {currentPage} of {totalPages}
			</p>
			<div className="flex gap-1">
				<Link
					href={createPageURL(currentPage - 1)}
					className={
						currentPage <= 1
							? "pointer-events-none opacity-50"
							: "cursor-pointer"
					}
				>
					<Button
						variant="outline"
						size="sm"
						className="rounded-lg h-8 w-8 p-0"
						disabled={currentPage <= 1}
					>
						<ChevronLeft size={16} />
					</Button>
				</Link>

				{[...Array(totalPages)].map((_, i) => {
					const page = i + 1;
					const isShow =
						page === 1 ||
						page === totalPages ||
						(page >= currentPage - 1 && page <= currentPage + 1);

					if (!isShow) return null;

					return (
						<Link key={i} href={createPageURL(page)}>
							<Button
								variant={currentPage === page ? "default" : "outline"}
								size="sm"
								className="rounded-lg h-8 w-8 p-0"
							>
								{page}
							</Button>
						</Link>
					);
				})}

				<Link
					href={createPageURL(currentPage + 1)}
					className={cn(
						currentPage >= totalPages
							? "pointer-events-none opacity-50"
							: "cursor-pointer",
					)}
				>
					<Button
						variant="outline"
						size="sm"
						className="rounded-lg h-8 w-8 p-0"
						disabled={currentPage >= totalPages}
					>
						<ChevronRight size={16} />
					</Button>
				</Link>
			</div>
		</div>
	);
}
