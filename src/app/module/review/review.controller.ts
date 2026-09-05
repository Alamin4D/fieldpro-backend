import { Request, Response } from "express";
import { ReviewService } from "./review.service";

const createReview = async (req: Request, res: Response) => {
	const customerId = req.user!.userId;

	const result = await ReviewService.createReview(customerId, req.body);

	res.status(201).json({
		success: true,
		message: "Review created successfully",
		data: result,
	});
};

const getTechnicianReviews = async (req: Request, res: Response) => {
	const { technicianId } = req.params;

	const result = await ReviewService.getTechnicianReviews(
		technicianId as string,
		req.query as unknown as {
			page: number;
			limit: number;
		},
	);

	res.status(200).json({
		success: true,
		message: "Technician reviews retrieved successfully",
		data: result,
	});
};

const getReviewById = async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await ReviewService.getReviewById(id as string);

	res.status(200).json({
		success: true,
		message: "Review retrieved successfully",
		data: result,
	});
};

const updateReview = async (req: Request, res: Response) => {
	const customerId = req.user!.userId;
	const { id } = req.params;

	const result = await ReviewService.updateReview(
		id as string,
		customerId,
		req.body,
	);

	res.status(200).json({
		success: true,
		message: "Review updated successfully",
		data: result,
	});
};

const deleteReview = async (req: Request, res: Response) => {
	const customerId = req.user!.userId;
	const { id } = req.params;

	await ReviewService.deleteReview(id as string, customerId);

	res.status(200).json({
		success: true,
		message: "Review deleted successfully",
		data: null,
	});
};

export const ReviewController = {
	createReview,
	getTechnicianReviews,
	getReviewById,
	updateReview,
	deleteReview,
};
