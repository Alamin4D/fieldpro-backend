import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import path from "path";
import type { TokenPayload } from "google-auth-library";
import type { JwtPayload, SignOptions } from "jsonwebtoken";

import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterUserPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import httpStatus from "http-status";
import config from "../config";
import { googleClient } from "../lib/googleAuth";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";
import { redisClient } from "../lib/redis";
import { transporter } from "../lib/nodemailer";
import { AuthProvider, Role, UserStatus } from "../../generated/prisma/enums";

// CONSTANTS
const OTP_EXPIRATION_SECONDS = 5 * 60;

const REGISTRATION_OTP_PREFIX = "user-registration-otp:";
const REGISTRATION_DATA_PREFIX = "user-registration-data:";

const FORGOT_PASSWORD_OTP_PREFIX = "forgot-password-otp:";

// HELPERS
const normalizeEmail = (email: string) => {
	return email.trim().toLowerCase();
};

const generateOtp = () => {
	return crypto.randomInt(100000, 1000000).toString();
};

const hashPassword = async (password: string) => {
	return bcrypt.hash(password, Number(config.bcrypt_salt_rounds) || 10);
};

const generateTokens = (user: {
	id: string;
	name: string;
	email: string;
	role: Role;
}) => {
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const registerUser = async (payload: IRegisterUserPayload) => {
	const { name, password, phone, role = Role.CUSTOMER } = payload;

	const email = normalizeEmail(payload.email);

	if (![Role.CUSTOMER, Role.TECHNICIAN].includes(role)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid registration role");
	}

	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		if (existingUser.status === UserStatus.BANNED) {
			throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
		}

		if (existingUser.status === UserStatus.INACTIVE) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"User account has been deleted",
			);
		}

		if (!existingUser.emailVerified) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Email already registered but not verified. Please verify your email.",
			);
		}

		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists",
		);
	}

	const hashedPassword = await hashPassword(password);

	const otp = generateOtp();

	const otpKey = `${REGISTRATION_OTP_PREFIX}${email}`;

	const registrationDataKey = `${REGISTRATION_DATA_PREFIX}${email}`;

	await redisClient.set(otpKey, otp, {
		expiration: {
			type: "EX",
			value: OTP_EXPIRATION_SECONDS,
		},
	});

	const registrationData = {
		name,
		email,
		password: hashedPassword,
		phone,
		role,
	};

	await redisClient.set(registrationDataKey, JSON.stringify(registrationData), {
		expiration: {
			type: "EX",
			value: OTP_EXPIRATION_SECONDS,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/registration-user-otp.ejs",
	);

	const templateData = {
		name,
		email,
		otp,
		expirationMinutes: OTP_EXPIRATION_SECONDS / 60,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Verify Your Email",
		html,
	});

	return {
		message:
			"Registration successful. Please check your email for the verification OTP.",
	};
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const email = normalizeEmail(payload.email);

	const otp = payload.otp;

	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		if (existingUser.status === UserStatus.BANNED) {
			throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
		}

		if (existingUser.status === UserStatus.INACTIVE) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"User account has been deleted",
			);
		}

		if (existingUser.emailVerified) {
			throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
		}
	}

	const otpKey = `${REGISTRATION_OTP_PREFIX}${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or is invalid");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const registrationDataKey = `${REGISTRATION_DATA_PREFIX}${email}`;

	const redisRegistrationData = await redisClient.get(registrationDataKey);

	if (!redisRegistrationData) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Registration session has expired. Please register again.",
		);
	}

	const registrationData = JSON.parse(
		redisRegistrationData,
	) as IRegisterUserPayload & {
		password: string;
	};

	const createdUser = await prisma.user.create({
		data: {
			name: registrationData.name,
			email: registrationData.email,
			password: registrationData.password,
			phone: registrationData.phone,
			role: registrationData.role ?? Role.CUSTOMER,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			authProvider: AuthProvider.CREDENTIAL,
		},

		omit: {
			password: true,
		},
	});

	await redisClient.del([otpKey, registrationDataKey]);

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/user-welcome-email.ejs",
	);

	try {
		const html = await ejs.renderFile(templatePath, {
			name: createdUser.name,
		});

		await transporter.sendMail({
			from: config.email_sender,
			to: createdUser.email,
			subject: "Welcome to FixItNow",
			html,
		});
	} catch (error) {
		console.error("Welcome email failed:", error);
	}

	const tokens = generateTokens({
		id: createdUser.id,
		name: createdUser.name,
		email: createdUser.email,
		role: createdUser.role,
	});

	return {
		user: createdUser,
		...tokens,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const email = normalizeEmail(payload.email);

	const { password } = payload;

	// ----------------------------------------------------------
	// Find user
	// ----------------------------------------------------------

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User account has been deleted");
	}

	if (!user.emailVerified) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please verify your email before logging in",
		);
	}

	if (user.authProvider === AuthProvider.GOOGLE && !user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was registered with Google. Please login with Google.",
		);
	}

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Password login is not available for this account",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	const tokens = generateTokens({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	});

	return {
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
	};
};

const getMe = async (user: IRequestUser) => {
	const existingUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},

		omit: {
			password: true,
		},

		include: {
			technicianProfile: true,
		},
	});

	if (!existingUser) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (existingUser.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (existingUser.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User account has been deleted");
	}

	return existingUser;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: {
			id: data.userId as string,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account is inactive");
	}

	const tokens = generateTokens({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	});

	return tokens;
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.error("Google ID token verification failed:", error);

		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID token",
		);
	}

	if (!googleIdTokenPayload) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Google ID token");
	}

	if (!googleIdTokenPayload.email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google email not found");
	}

	if (!googleIdTokenPayload.name) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google account name not found");
	}

	const email = normalizeEmail(googleIdTokenPayload.email);

	const googleId = googleIdTokenPayload.sub;

	let user = await prisma.user.findUnique({
		where: {
			googleId,
		},
	});

	if (!user) {
		user = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (user) {
			if (user.status === UserStatus.BANNED) {
				throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
			}

			if (user.status === UserStatus.INACTIVE) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					"User account has been deleted",
				);
			}

			user = await prisma.user.update({
				where: {
					id: user.id,
				},

				data: {
					googleId,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
					avatar: googleIdTokenPayload.picture ?? user.avatar,
				},
			});
		} else {
			user = await prisma.user.create({
				data: {
					name: googleIdTokenPayload.name,

					email,

					avatar: googleIdTokenPayload.picture ?? null,

					googleId,

					role: Role.CUSTOMER,

					status: UserStatus.ACTIVE,

					emailVerified: true,

					authProvider: AuthProvider.GOOGLE,
				},
			});
		}
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User account has been deleted");
	}

	const tokens = generateTokens({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	});

	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			phone: user.phone,
			avatar: user.avatar,
			status: user.status,
		},

		...tokens,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const email = normalizeEmail(payload.email);

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User account has been deleted");
	}

	if (!user.emailVerified) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Please verify your email first",
		);
	}

	if (user.authProvider === AuthProvider.GOOGLE && !user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account uses Google login. Password reset is not required.",
		);
	}

	const otp = generateOtp();

	const key = `${FORGOT_PASSWORD_OTP_PREFIX}${email}`;

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: OTP_EXPIRATION_SECONDS,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/forgot-password.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: user.name,
		otp,
		expirationMinutes: OTP_EXPIRATION_SECONDS / 60,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: user.email,
		subject: "Reset Your Password",
		html,
	});

	return {
		message: "Password reset OTP has been sent to your email.",
	};
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const email = normalizeEmail(payload.email);

	const { otp, newPassword } = payload;

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User account has been deleted");
	}

	if (user.authProvider === AuthProvider.GOOGLE && !user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account uses Google login",
		);
	}

	const key = `${FORGOT_PASSWORD_OTP_PREFIX}${email}`;

	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or is invalid");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const hashedNewPassword = await hashPassword(newPassword);

	await prisma.user.update({
		where: {
			id: user.id,
		},

		data: {
			password: hashedNewPassword,
		},
	});

	await redisClient.del([key]);

	try {
		const templatePath = path.join(
			process.cwd(),
			"src/app/templates/reset-password-success.ejs",
		);

		const html = await ejs.renderFile(templatePath, {
			name: user.name,
		});

		await transporter.sendMail({
			from: config.email_sender,
			to: user.email,
			subject: "Password Changed Successfully",
			html,
		});
	} catch (error) {
		console.error("Password confirmation email failed:", error);
	}

	return {
		message: "Password has been reset successfully.",
	};
};


export const AuthService = {
	registerUser,
	verifyEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
};
