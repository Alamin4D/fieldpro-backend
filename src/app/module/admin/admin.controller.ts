import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const getDashboardStats = async (_req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();

	res.status(200).json({
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

	res.status(200).json({
		success: true,
		message: "Users retrieved successfully",
		data: result,
	});
};

const getUserById = async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await AdminService.getUserById(id as string);

	res.status(200).json({
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

	res.status(200).json({
		success: true,
		message: "User status updated successfully",
		data: result,
	});
};

const deleteUser = async (req: Request, res: Response) => {
	const adminId = req.user!.userId;
	const { id } = req.params;

	await AdminService.deleteUser(adminId, id as string);

	res.status(200).json({
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

	res.status(200).json({
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

	res.status(200).json({
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
