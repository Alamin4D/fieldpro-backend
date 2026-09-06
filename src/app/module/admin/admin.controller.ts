import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status"

const getDashboardStats = async (_req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin dashboard statistics retrieved successfully",
		data: result,
	});
};

const getUsers = async (req: Request, res: Response) => {
	const result = await AdminService.getUsers(
		req.query as unknown as {
			page: number;
			limit: number;
			search?: string;
			role?: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
			status?: "ACTIVE" | "INACTIVE" | "BANNED";
		},
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users retrieved successfully",
		data: result,
	});
};

const getUserById = async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await AdminService.getUserById(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User retrieved successfully",
		data: result,
	});
};

const updateUserStatus = async (req: Request, res: Response) => {
	const adminId = req.user!.userId;
	const { id } = req.params;

	const result = await AdminService.updateUserStatus(
		adminId,
		id as string,
		req.body.status,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User status updated successfully",
		data: result,
	});
};

const deleteUser = async (req: Request, res: Response) => {
	const adminId = req.user!.userId;
	const { id } = req.params;

	await AdminService.deleteUser(adminId, id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User deleted successfully",
		data: null,
	});
};

const getBookings = async (req: Request, res: Response) => {
	const result = await AdminService.getBookings(
		req.query as unknown as {
			page: number;
			limit: number;
			status?: any;
		},
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Bookings retrieved successfully",
		data: result,
	});
};

const getPayments = async (req: Request, res: Response) => {
	const result = await AdminService.getPayments(
		req.query as unknown as {
			page: number;
			limit: number;
		},
	);

	sendResponse(res,{
		statusCode: httpStatus.OK,
		success: true,
		message: "Payments retrieved successfully",
		data: result,
	});
};

export const AdminController = {
	getDashboardStats,
	getUsers,
	getUserById,
	updateUserStatus,
	deleteUser,
	getBookings,
	getPayments,
};
