import { Router } from "express";

import {
	userQuerySchema,
	updateUserStatusSchema,
	bookingQuerySchema,
} from "./admin.validation";

import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { AdminController } from "./admin.controller";

const router = Router();

// ==========================================
// Dashboard
// ==========================================

router.get("/dashboard", auth(Role.ADMIN), AdminController.getDashboardStats);

// ==========================================
// Users
// ==========================================

router.get(
	"/users",
	auth(Role.ADMIN),
	validateRequest(userQuerySchema),
	AdminController.getUsers,
);

router.get("/users/:id", auth(Role.ADMIN), AdminController.getUserById);

router.patch(
	"/users/:id/status",
	auth(Role.ADMIN),
	validateRequest(updateUserStatusSchema),
	AdminController.updateUserStatus,
);

router.delete("/users/:id", auth(Role.ADMIN), AdminController.deleteUser);

// ==========================================
// Bookings
// ==========================================

router.get(
	"/bookings",
	auth(Role.ADMIN),
	validateRequest(bookingQuerySchema),
	AdminController.getBookings,
);

// ==========================================
// Payments
// ==========================================

router.get("/payments", auth(Role.ADMIN), AdminController.getPayments);

export const AdminRoutes = router;
