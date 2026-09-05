import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";


const createReview = async (
	customerId: string,
	payload: {
		bookingId: string;
		rating: number | string;
		comment?: string;
	},
) => {
	const booking = await prisma.booking.findUnique({
		where: {
			id: payload.bookingId,
		},
		include: {
			payment: true,
			review: true,
		},
	});

	if (!booking) {
		throw new AppError(404, "Booking not found");
	}

	if (booking.customerId !== customerId) {
		throw new AppError(403, "You can only review your own booking");
	}

	if (booking.status !== BookingStatus.COMPLETED) {
		throw new AppError(400, "You can only review a completed booking");
	}

	if (!booking.payment || booking.payment.status !== PaymentStatus.PAID) {
		throw new AppError(400, "You can only review a paid booking");
	}

	if (booking.review) {
		throw new AppError(409, "This booking has already been reviewed");
	}

	const numericRating = Number(payload.rating);
	if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
		throw new AppError(400, "Rating must be a number between 1 and 5");
	}

	const review = await prisma.review.create({
		data: {
			bookingId: booking.id,
			customerId,
			technicianId: booking.technicianId,
			rating: numericRating,
			comment: payload.comment,
		},
		include: {
			booking: {
				select: {
					id: true,
					status: true,
					scheduledAt: true,
					totalAmount: true,
				},
			},
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
		},
	});

	return review;
};

// Get technician reviews
const getTechnicianReviews = async (
	technicianId: string,
	query: {
		page: number | string;
		limit: number | string;
	},
) => {

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;


	const technician = await prisma.technicianProfile.findUnique({
		where: {
			id: technicianId,
		},
	});

	if (!technician) {
		throw new AppError(404, "Technician not found");
	}


	const [reviews, total] = await Promise.all([
		prisma.review.findMany({
			where: {
				technicianId,
			},
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
			},
		}),

		prisma.review.count({
			where: {
				technicianId,
			},
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit) || 1, 
		},
		data: reviews, 
	};
};

// Get single review
const getReviewById = async (reviewId: string) => {
	const review = await prisma.review.findUnique({
		where: {
			id: reviewId,
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
			booking: {
				select: {
					id: true,
					status: true,
					scheduledAt: true,
					totalAmount: true,
				},
			},
		},
	});

	if (!review) {
		throw new AppError(404, "Review not found");
	}

	return review;
};

// Update own review
const updateReview = async (
	reviewId: string,
	customerId: string,
	payload: {
		rating?: number | string;
		comment?: string;
	},
) => {
	const review = await prisma.review.findUnique({
		where: {
			id: reviewId,
		},
	});

	if (!review) {
		throw new AppError(404, "Review not found");
	}


	if (review.customerId !== customerId) {
		throw new AppError(403, "You can only update your own review");
	}

	const updateData: any = {};

	if (payload.comment !== undefined) {
		updateData.comment = payload.comment;
	}

	if (payload.rating !== undefined) {
		const numericRating = Number(payload.rating);
		if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
			throw new AppError(400, "Rating must be a number between 1 and 5");
		}
		updateData.rating = numericRating;
	}

	const updatedReview = await prisma.review.update({
		where: {
			id: reviewId,
		},
		data: updateData,
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
						},
					},
				},
			},
		},
	});

	return updatedReview;
};

// Delete own review
const deleteReview = async (reviewId: string, customerId: string) => {
	const review = await prisma.review.findUnique({
		where: {
			id: reviewId,
		},
	});

	if (!review) {
		throw new AppError(404, "Review not found");
	}

	if (review.customerId !== customerId) {
		throw new AppError(403, "You can only delete your own review");
	}

	await prisma.review.delete({
		where: {
			id: reviewId,
		},
	});

	return null;
};

export const ReviewService = {
	createReview,
	getTechnicianReviews,
	getReviewById,
	updateReview,
	deleteReview,
};
