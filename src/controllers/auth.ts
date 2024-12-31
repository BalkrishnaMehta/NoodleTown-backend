import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.js";
import { AppDataSource } from "../config/database.js";
import { validate } from "class-validator";
import { requestHandler } from "../utils/requestHandler.js";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { getConfig } from "../utils/config.js";
import {
  generateToken,
  generateAuthTokens,
  setRefreshTokenCookie,
} from "../utils/auth.utils.js";

const env = getConfig();

const userRepository = AppDataSource.getRepository(User);

export const createUser = requestHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;

    const errors = await validate(user);
    if (errors.length > 0) {
      throw new ValidationError(Object.values(errors[0].constraints!)[0]);
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    const savedUser = await userRepository.save(user);

    const { accessToken, refreshToken } = generateAuthTokens({
      id: savedUser.id,
    });
    setRefreshTokenCookie(res, refreshToken);

    return res
      .status(201)
      .json(
        APIResponse.success(
          "User created successfully",
          { accessToken, id: user.id },
          201
        )
      );
  }
);

export const checkUser = requestHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await userRepository.findOne({
    where: { email },
    select: ["id", "name", "email", "password"],
  });

  const match = await bcrypt.compare(password, user?.password || "");
  if (!user || !match) {
    throw new AuthenticationError("Invalid email or password");
  }

  const { accessToken, refreshToken } = generateAuthTokens({
    id: user.id,
  });
  setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(
    APIResponse.success("Login successful", {
      accessToken,
      user: { id: user.id },
    })
  );
});

export const logout = requestHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  return res.status(200).json(APIResponse.success("Logged out successfully"));
});

export const refreshToken = requestHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError("No refresh token provided");
    }

    try {
      const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret!) as {
        id: string;
      };

      const user = await userRepository.findOne({
        where: { id: decoded.id },
        select: ["id"],
      });

      if (!user) {
        res.clearCookie("refreshToken");
        throw new NotFoundError("User not found");
      }

      const accessToken = generateToken(
        { id: user.id },
        "15m",
        env.jwtAccessSecret!
      );

      return res.status(200).json(
        APIResponse.success("Token refreshed successfully", {
          accessToken,
          user: { id: user.id },
        })
      );
    } catch (error) {
      res.clearCookie("refreshToken");
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthenticationError("Invalid refresh token");
    }
  }
);
