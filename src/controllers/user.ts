import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { requestHandler } from "../utils/requestHandler.js"; // Import requestHandler utility
import { getUserIdFromToken } from "../utils/getUserIdFromToken.js";

const userRepository = AppDataSource.getRepository(User);

export const getUser = requestHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req);

  const user = await userRepository.findOne({
    where: { id: userId },
    select: ["id", "name", "email"],
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(200).json(APIResponse.success("User data retrieved", user));
});

export const updatePassword = requestHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromToken(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError("Both current and new passwords are required");
    }

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      throw new AuthenticationError("Invalid current password");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await userRepository.save(user);

    return res
      .status(200)
      .json(APIResponse.success("Password updated successfully"));
  }
);
