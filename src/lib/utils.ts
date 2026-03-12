import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const isAdmin = (role: string) => {
	return role === "admin" || role === "ADMIN";
};

export const isSubAdmin = (role: string) => {
	return role === "subadmin" || role === "SUBADMIN";
};

export const isAdminOrSubAdmin = (role?: string) => {
	if (!role) return false;
	return isAdmin(role) || isSubAdmin(role);
};

export const isUser = (role: string) => {
	if (!role) return false;
	return role === "user" || role === "USER";
};

export function formatRelativeTime(date: Date | string | number): string {
	const d = new Date(date);
	if (isNaN(d.getTime())) return "recently";

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

	if (diffInSeconds < 0) return "just now";
	if (diffInSeconds < 60) return "just now";

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60)
		return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24)
		return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30)
		return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12)
		return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;

	const diffInYears = Math.floor(diffInMonths / 12);
	return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
}
