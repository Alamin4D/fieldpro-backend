import { z } from "zod";

export const createServiceSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must not exceed 100 characters"),

	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug must contain only lowercase letters, numbers and hyphens",
		),

	description: z.string().min(10, "Description must be at least 10 characters"),

	category: z.string().min(2, "Category is required"),

	price: z.number().positive("Price must be greater than 0"),

	duration: z
		.number()
		.int("Duration must be an integer")
		.positive("Duration must be greater than 0"),

	image: z.string().url("Image must be a valid URL").optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export const serviceQuerySchema = z.object({
	search: z.string().optional(),

	category: z.string().optional(),

	isActive: z.enum(["true", "false"]).optional(),

	page: z.coerce.number().int().positive().default(1),

	limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
