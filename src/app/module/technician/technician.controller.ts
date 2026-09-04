import { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { TechnicianService } from "./technician.service";

/**
 * Create Technician Profile
 */
const createTechnicianProfile =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.createTechnicianProfile(
          req.user!.userId,
          req.body
        );

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message:
          "Technician profile created successfully",
        data: result,
      });
    }
  );

/**
 * Get Own Profile
 */
const getMyTechnicianProfile =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.getMyTechnicianProfile(
          req.user!.userId
        );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Technician profile retrieved successfully",
        data: result,
      });
    }
  );

/**
 * Update Own Profile
 */
const updateMyTechnicianProfile =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.updateMyTechnicianProfile(
          req.user!?.userId,
          req.body
        );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Technician profile updated successfully",
        data: result,
      });
    }
  );

/**
 * Get All Technicians
 */
const getAllTechnicians =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.getAllTechnicians(
          req.query as any
        );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Technicians retrieved successfully",
        data: result,
      });
    }
  );

/**
 * Get Technician By ID
 */
const getTechnicianById =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.getTechnicianById(
          req.params.id as string
        );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Technician retrieved successfully",
        data: result,
      });
    }
  );

/**
 * Toggle Availability
 */
const toggleAvailability =
  catchAsync(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await TechnicianService.toggleAvailability(
          req.user!?.userId
        );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Technician availability updated successfully",
        data: result,
      });
    }
  );

export const TechnicianController = {
  createTechnicianProfile,
  getMyTechnicianProfile,
  updateMyTechnicianProfile,
  getAllTechnicians,
  getTechnicianById,
  toggleAvailability,
};