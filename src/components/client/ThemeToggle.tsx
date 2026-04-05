"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		queueMicrotask(() => setMounted(true));
	}, []);

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon" className="size-9" aria-label="Theme">
				<span className="size-4" />
			</Button>
		);
	}

	const isDark = resolvedTheme === "dark";

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="size-9"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			onClick={() => setTheme(isDark ? "light" : "dark")}
		>
			{isDark ? (
				<Sun className="size-4 text-amber-500" />
			) : (
				<Moon className="size-4 text-muted-foreground" />
			)}
		</Button>
	);
}
