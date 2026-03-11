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
