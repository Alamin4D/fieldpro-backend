import { z } from "zod";

export const userQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
	role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"]).optional(),
	status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]).optional(),
});

export const updateUserStatusSchema = z.object({
	status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
});

export const bookingQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	status: z
		.enum([
			"PENDING",
			"ACCEPTED",
			"REJECTED",
			"IN_PROGRESS",
			"COMPLETED",
			"CANCELLED",
		])
		.optional(),
});
