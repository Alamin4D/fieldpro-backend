

import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import {
  CreateTechnicianProfileInput,
  TechnicianQueryInput,
  UpdateTechnicianProfileInput,
} from "./technician.validation";

/**
 * Create Technician Profile
 */
const createTechnicianProfile = async (
  userId: string,
  payload: CreateTechnicianProfileInput
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      404,
      "User not found"
    );
  }

  if (user.role !== "TECHNICIAN") {
    throw new AppError(
      403,
      "Only technicians can create technician profiles"
    );
  }

  const existingProfile =
    await prisma.technicianProfile.findUnique({
      where: {
        userId,
      },
    });

  if (existingProfile) {
    throw new AppError(
      409,
      "Technician profile already exists"
    );
  }

  const profile =
    await prisma.technicianProfile.create({
      data: {
        userId,
        bio: payload.bio,
        experience: payload.experience,
        specialization:
          payload.specialization,
        hourlyRate: new Prisma.Decimal(
          payload.hourlyRate
        ),
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

  return profile;
};

/**
 * Get Own Technician Profile
 */
const getMyTechnicianProfile =
  async (userId: string) => {
    const profile =
      await prisma.technicianProfile.findUnique({
        where: {
          userId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });

    if (!profile) {
      throw new AppError(
        404,
        "Technician profile not found"
      );
    }

    return profile;
  };

/**
 * Update Own Technician Profile
 */
const updateMyTechnicianProfile =
  async (
    userId: string,
    payload: UpdateTechnicianProfileInput
  ) => {
    const existingProfile =
      await prisma.technicianProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!existingProfile) {
      throw new AppError(
        404,
        "Technician profile not found"
      );
    }

    const profile =
      await prisma.technicianProfile.update({
        where: {
          userId,
        },

        data: {
          ...(payload.bio !== undefined && {
            bio: payload.bio,
          }),

          ...(payload.experience !==
            undefined && {
            experience:
              payload.experience,
          }),

          ...(payload.specialization !==
            undefined && {
            specialization:
              payload.specialization,
          }),

          ...(payload.hourlyRate !==
            undefined && {
            hourlyRate:
              new Prisma.Decimal(
                payload.hourlyRate
              ),
          }),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });

    return profile;
  };

/**
 * Get All Technicians
 */
const getAllTechnicians = async (query: TechnicianQueryInput) => {
  const {
    search,
    specialization,
    isAvailable,
    minRate,
    maxRate,
    page = 1, // Fallback default to prevent NaN in skip
    limit = 10, // Fallback default
  } = query;

  const skip = (page - 1) * limit;
  
  // Use an array to securely combine multiple independent conditions
  const andConditions: Prisma.TechnicianProfileWhereInput[] = [];

  /**
   * Search (Applies OR logic across fields)
   */
  if (search) {
    andConditions.push({
      OR: [
        { specialization: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  /**
   * Specialization Filter
   */
  if (specialization) {
    andConditions.push({
      specialization: { contains: specialization, mode: "insensitive" },
    });
  }

  /**
   * Availability Filter
   */
  if (isAvailable !== undefined) {
    andConditions.push({
      isAvailable: isAvailable === "true" // Safeguard boolean/string types
    });
  }

  /**
   * Hourly Rate Filter
   */
  if (minRate !== undefined || maxRate !== undefined) {
    const rateCondition: Prisma.TechnicianProfileWhereInput["hourlyRate"] = {};
    
    if (minRate !== undefined) {
      rateCondition.gte = new Prisma.Decimal(minRate);
    }
    if (maxRate !== undefined) {
      rateCondition.lte = new Prisma.Decimal(maxRate);
    }
    
    andConditions.push({ hourlyRate: rateCondition });
  }

  // Construct final where clause: only apply AND if conditions exist
  const where: Prisma.TechnicianProfileWhereInput = 
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Execute Transaction
  const [technicians, total] = await prisma.$transaction([
    prisma.technicianProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { rating: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.technicianProfile.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: technicians,
  };
};


/**
 * Get Technician By ID
 */
const getTechnicianById = async (
  id: string
) => {
  const technician =
    await prisma.technicianProfile.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

  if (!technician) {
    throw new AppError(
      404,
      "Technician not found"
    );
  }

  return technician;
};

/**
 * Toggle Availability
 */
const toggleAvailability =
  async (userId: string) => {
    const profile =
      await prisma.technicianProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new AppError(
        404,
        "Technician profile not found"
      );
    }

    const updatedProfile =
      await prisma.technicianProfile.update({
        where: {
          userId,
        },

        data: {
          isAvailable:
            !profile.isAvailable,
        },
      });

    return updatedProfile;
  };

export const TechnicianService = {
  createTechnicianProfile,
  getMyTechnicianProfile,
  updateMyTechnicianProfile,
  getAllTechnicians,
  getTechnicianById,
  toggleAvailability,
};