import { Request, Response } from "express";
import { User } from "../models/user.js";
import { AppDataSource } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validate } from "class-validator";
import dotenv from "dotenv";

dotenv.config();
const userRepository = AppDataSource.getRepository(User);

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userRepository.exists({
      where: { email },
    });
    if (existingUser) {
      console.log("Register Failed: User already exists");
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;

    const errors = await validate(user);
    if (errors.length > 0) {
      return res.status(400).json(errors);
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    const savedUser = await userRepository.save(user);

    const secret = process.env.JWT_SECRET_KEY || "secret";
    const token = jwt.sign(
      { email: savedUser.email, id: savedUser.id },
      secret,
      {
        expiresIn: "30d",
      }
    );
    console.log(`Created user ${savedUser.email}.`);
    res.status(200).json({ token, id: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const checkUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findOne({
      where: { email },
      select: ["id", "name", "email", "password"],
    });

    if (!user) {
      console.log("Login Failed: User does not exists");
      return res
        .status(404)
        .json({ message: "User not found. Register your account." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Login Failed: Password does not match");
      return res.status(401).json({ message: "Password does not match." });
    }

    const secret = process.env.JWT_SECRET_KEY || "secret";
    const token = jwt.sign({ email: user.email, id: user.id }, secret, {
      expiresIn: "30d",
    });

    console.log(`${user.email} logged In.`);
    res.status(200).json({ token, id: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};
