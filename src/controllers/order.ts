import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Address, Order, User } from "../models/user.js";
import { Cart, CartItem } from "../models/cart.js";
import { APIResponse } from "../utils/APIResponse.js";
import { NotFoundError, ValidationError } from "../models/error.js";
import { requestHandler } from "../utils/requestHandler.js";
import { getUserIdFromToken } from "../utils/getUserIdFromToken.js";

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const addressRepository = AppDataSource.getRepository(Address);
const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);

export const makeOrder = requestHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req);

  const { addressTitle, order } = req.body;

  if (!addressTitle || !order) {
    throw new ValidationError("Order data is required");
  }

  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const savedOrder = await orderRepository.save({
    ...order,
    user,
  });

  const cart = await cartRepository.findOne({
    where: { user: { id: userId } },
    relations: ["cartItems"],
  });

  if (cart) {
    await cartItemRepository.delete({ cart: { id: cart.id } });
    await cartRepository.delete({ id: cart.id });
  }

  await addressRepository.update(
    { user: { id: userId }, isLastUsed: true },
    { isLastUsed: false }
  );

  await addressRepository.update(
    { user: { id: userId }, title: addressTitle },
    { isLastUsed: true }
  );

  return res.status(201).json(
    APIResponse.success("Order placed successfully", {
      order: savedOrder,
    })
  );
});

export const getOrders = requestHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req);

  const orders = await orderRepository.find({
    where: { user: { id: userId } },
    order: { createdAt: "DESC" },
  });

  return res
    .status(200)
    .json(APIResponse.success("Orders retrieved successfully", orders));
});

export const getOrderData = requestHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id;

    const order = await orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return res
      .status(200)
      .json(APIResponse.success("Order data retrieved successfully", order));
  }
);
