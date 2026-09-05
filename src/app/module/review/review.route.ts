import { Router } from "express";

import { ReviewController } from "./review.controller";
import {
	createReviewSchema,
	updateReviewSchema,
	reviewQuerySchema,
} from "./review.validation";

import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Create Review
router.post(
	"/",
	auth(Role.CUSTOMER),
	validateRequest(createReviewSchema),
	ReviewController.createReview,
);

// Get Technician Reviews
router.get(
	"/technician/:technicianId",
	validateRequest(reviewQuerySchema),
	ReviewController.getTechnicianReviews,
);

// Get Single Review
router.get("/:id", ReviewController.getReviewById);

// Update Own Review
router.patch(
	"/:id",
	auth(Role.CUSTOMER),
	validateRequest(updateReviewSchema),
	ReviewController.updateReview,
);

// Delete Own Review
router.delete("/:id", auth(Role.CUSTOMER), ReviewController.deleteReview);

export const ReviewRoutes = router;
