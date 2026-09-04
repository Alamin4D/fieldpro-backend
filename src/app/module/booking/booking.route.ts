import { Router } from "express";

import { BookingController } from "./booking.controller";

import {
	createBookingSchema,
	updateBookingStatusSchema,
	bookingQuerySchema,
} from "./booking.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

// ==========================================
// CUSTOMER
// ==========================================

// Create booking
router.post(
	"/",
	auth(Role.CUSTOMER),
	validateRequest(createBookingSchema),
	BookingController.createBooking,
);

// Get customer's bookings
router.get(
	"/my",
	auth(Role.CUSTOMER),
	validateRequest(bookingQuerySchema),
	BookingController.getCustomerBookings,
);

// Customer cancel booking
router.patch(
	"/:id/cancel",
	auth(Role.CUSTOMER),
	BookingController.cancelBooking,
);

// ==========================================
// TECHNICIAN
// ==========================================

// Get technician bookings
router.get(
	"/technician/my",
	auth(Role.TECHNICIAN),
	validateRequest(bookingQuerySchema),
	BookingController.getTechnicianBookings,
);

// Technician update booking status
router.patch(
	"/:id/status",
	auth(Role.TECHNICIAN),
	validateRequest(updateBookingStatusSchema),
	BookingController.updateBookingStatus,
);

// ==========================================
// SHARED
// ==========================================

// Get single booking
router.get(
	"/:id",
	auth(Role.CUSTOMER, Role.TECHNICIAN),
	BookingController.getBookingById,
);

export const BookingRoutes = router;
