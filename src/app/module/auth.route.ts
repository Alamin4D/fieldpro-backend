import { Router } from "express";

import { AuthController } from "./auth.controller";
import { auth } from "../middleware/auth/checkAuth";
import { Role } from "../../generated/prisma/enums";

const router = Router();

// Register
router.post("/register", AuthController.registerUser);

// Verify email OTP
router.post("/verify-email", AuthController.verifyEmail);

// Login
router.post("/login", AuthController.loginUser);

// Google Login
router.post("/google-login", AuthController.googleLogin);

// Refresh access token
router.post("/refresh-token", AuthController.refreshToken);

// Forgot password
router.post("/forgot-password", AuthController.forgotPassword);

// Reset password
router.post("/reset-password", AuthController.resetPassword);

// Get current logged-in user
router.get(
	"/me",
	auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
	AuthController.getMe,
);

export const AuthRoutes = router;
