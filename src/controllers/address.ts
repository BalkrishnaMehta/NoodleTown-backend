import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Address, User } from "../models/user.js";
import { getUserIdFromToken } from "../utils/getUserIdFromToken.js";
import { APIResponse } from "../utils/APIResponse.js";
import { requestHandler } from "../utils/requestHandler.js";
import { ValidationError, NotFoundError } from "../models/error.js";

const userRepository = AppDataSource.getRepository(User);
const addressRepository = AppDataSource.getRepository(Address);

export const getAddresses = requestHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromToken(req);

    const addresses = await addressRepository.find({
      where: { user: { id: userId } },
    });

    return res
      .status(200)
      .json(
        APIResponse.success("Fetched addresses successfully", addresses || [])
      );
  }
);

export const addAddress = requestHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromToken(req);

    const { address } = req.body;

    if (!address) {
      throw new ValidationError("Address data is required");
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (address.isDefault) {
      await addressRepository.update(
        { user: { id: userId }, isDefault: true },
        { isDefault: false }
      );
    }

    const newAddress = addressRepository.create({
      ...address,
      user,
    });

    await addressRepository.save(newAddress);

    return res
      .status(201)
      .json(APIResponse.success("Address added successfully", newAddress, 201));
  }
);
