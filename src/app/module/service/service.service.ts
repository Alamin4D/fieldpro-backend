import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

import {
	CreateServiceInput,
	ServiceQueryInput,
	UpdateServiceInput,
} from "./service.validation";

const createService = async (payload: CreateServiceInput) => {
	const existingService = await prisma.service.findUnique({
		where: {
			slug: payload.slug,
		},
	});

	if (existingService) {
		throw new AppError(409, "A service with this slug already exists");
	}

	const service = await prisma.service.create({
		data: {
			title: payload.title,
			slug: payload.slug,
			description: payload.description,
			category: payload.category,
			price: new Prisma.Decimal(payload.price),
			duration: payload.duration,
			image: payload.image,
		},
	});

	return service;
};

const getAllServices = async (query: ServiceQueryInput) => {
	const { search, category, isActive } = query;

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;

	const skip = (page - 1) * limit;

	const where: Prisma.ServiceWhereInput = {};

	if (search) {
		where.OR = [
			{
				title: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
		];
	}

	if (category) {
		where.category = category;
	}

	if (isActive !== undefined) {
		where.isActive = isActive === "true";
	}

	const [services, total] = await prisma.$transaction([
		prisma.service.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),

		prisma.service.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: services,
	};
};

const getServiceById = async (id: string) => {
	const service = await prisma.service.findUnique({
		where: {
			id,
		},
	});

	if (!service) {
		throw new AppError(httpStatus.NOT_FOUND, "Service not found");
	}

	return service;
};

const updateService = async (id: string, payload: UpdateServiceInput) => {
	const existingService = await prisma.service.findUnique({
		where: {
			id,
		},
	});

	if (!existingService) {
		throw new AppError(httpStatus.NOT_FOUND, "Service not found");
	}

	if (payload.slug) {
		const slugExists = await prisma.service.findFirst({
			where: {
				slug: payload.slug,
				NOT: {
					id,
				},
			},
		});

		if (slugExists) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A service with this slug already exists",
			);
		}
	}

	const service = await prisma.service.update({
		where: {
			id,
		},

		data: {
			...(payload.title !== undefined && {
				title: payload.title,
			}),

			...(payload.slug !== undefined && {
				slug: payload.slug,
			}),

			...(payload.description !== undefined && {
				description: payload.description,
			}),

			...(payload.category !== undefined && {
				category: payload.category,
			}),

			...(payload.price !== undefined && {
				price: new Prisma.Decimal(payload.price),
			}),

			...(payload.duration !== undefined && {
				duration: payload.duration,
			}),

			...(payload.image !== undefined && {
				image: payload.image,
			}),

			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return service;
};

const deleteService = async (id: string) => {
	const service = await prisma.service.findUnique({
		where: {
			id,
		},
	});

	if (!service) {
		throw new AppError(httpStatus.NOT_FOUND, "Service not found");
	}

	/*
	 * Soft delete
	 *
	 * We don't physically delete the service
	 * because existing bookings may reference it.
	 */

	const updatedService = await prisma.service.update({
		where: {
			id,
		},

		data: {
			isActive: false,
		},
	});

	return updatedService;
};

export const ServiceService = {
	createService,
	getAllServices,
	getServiceById,
	updateService,
	deleteService,
};
