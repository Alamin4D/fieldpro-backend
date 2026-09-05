import { Prisma } from "../../../generated/prisma/client";
import {
	BookingStatus,
	PaymentStatus,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const getDashboardStats = async () => {
	const [
		totalUsers,
		totalCustomers,
		totalTechnicians,
		totalAdmins,
		activeUsers,
		bannedUsers,
		totalServices,
		activeServices,
		totalBookings,
		pendingBookings,
		completedBookings,
		totalPayments,
		paidPayments,
		totalReviews,
	] = await Promise.all([
		prisma.user.count(),

		prisma.user.count({
			where: {
				role: Role.CUSTOMER,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.TECHNICIAN,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.ADMIN,
			},
		}),

		prisma.user.count({
			where: {
				status: UserStatus.ACTIVE,
			},
		}),

		prisma.user.count({
			where: {
				status: UserStatus.BANNED,
			},
		}),

		prisma.service.count(),

		prisma.service.count({
			where: {
				isActive: true,
			},
		}),

		prisma.booking.count(),

		prisma.booking.count({
			where: {
				status: BookingStatus.PENDING,
			},
		}),

		prisma.booking.count({
			where: {
				status: BookingStatus.COMPLETED,
			},
		}),

		prisma.payment.count(),

		prisma.payment.count({
			where: {
				status: PaymentStatus.PAID,
			},
		}),

		prisma.review.count(),
	]);

	const paidRevenue = await prisma.payment.aggregate({
		where: {
			status: PaymentStatus.PAID,
		},
		_sum: {
			amount: true,
		},
	});

	return {
		users: {
			total: totalUsers,
			customers: totalCustomers,
			technicians: totalTechnicians,
			admins: totalAdmins,
			active: activeUsers,
			banned: bannedUsers,
		},

		services: {
			total: totalServices,
			active: activeServices,
		},

		bookings: {
			total: totalBookings,
			pending: pendingBookings,
			completed: completedBookings,
		},

		payments: {
			total: totalPayments,
			paid: paidPayments,
			revenue: paidRevenue._sum.amount ?? 0,
		},

		reviews: {
			total: totalReviews,
		},
	};
};

const getUsers = async (query: {
	page: number | string;
	limit: number | string;
	search?: string;
	role?: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
	status?: "ACTIVE" | "INACTIVE" | "BANNED";
}) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where: Prisma.UserWhereInput = {};

	if (query.search) {
		where.OR = [
			{
				name: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				email: {
					contains: query.search,
					mode: "insensitive",
				},
			},
		];
	}

	if (query.role) {
		where.role = query.role;
	}

	if (query.status) {
		where.status = query.status;
	}

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		}),

		prisma.user.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit) || 1,
		},
		data: users,
	};
};

const getUserById = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			createdAt: true,
			updatedAt: true,

			technicianProfile: true,

			_count: {
				select: {
					customerBookings: true,
					reviews: true,
				},
			},
		},
	});

	if (!user) {
		throw new AppError(404, "User not found");
	}

	return user;
};

const updateUserStatus = async (
	adminId: string,
	userId: string,
	status: "ACTIVE" | "INACTIVE" | "BANNED",
) => {
	if (adminId === userId) {
		throw new AppError(400, "Admin cannot change their own status");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found");
	}

	if (user.role === Role.ADMIN) {
		throw new AppError(403, "Admin user status cannot be changed");
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			status,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

const deleteUser = async (adminId: string, userId: string) => {
	if (adminId === userId) {
		throw new AppError(400, "Admin cannot delete their own account");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found");
	}

	if (user.role === Role.ADMIN) {
		throw new AppError(403, "Admin users cannot be deleted");
	}

	await prisma.user.delete({
		where: {
			id: userId,
		},
	});

	return null;
};

const getBookings = async (query: {
	page: number | string;
	limit: number | string;
	status?: BookingStatus;
}) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where: Prisma.BookingWhereInput = {};

	if (query.status) {
		where.status = query.status;
	}

	const [bookings, total] = await Promise.all([
		prisma.booking.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				customer: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},

				technician: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},

				service: {
					select: {
						id: true,
						title: true,
						price: true,
					},
				},

				payment: true,

				review: true,
			},
		}),

		prisma.booking.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit) || 1,
		},
		data: bookings,
	};
};

const getPayments = async (query: {
	page: number | string;
	limit: number | string;
}) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const [payments, total] = await Promise.all([
		prisma.payment.findMany({
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				booking: {
					select: {
						id: true,
						status: true,
						customer: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
			},
		}),

		prisma.payment.count(),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit) || 1,
		},
		data: payments,
	};
};

export const AdminService = {
	getDashboardStats,
	getUsers,
	getUserById,
	updateUserStatus,
	deleteUser,
	getBookings,
	getPayments,
};
