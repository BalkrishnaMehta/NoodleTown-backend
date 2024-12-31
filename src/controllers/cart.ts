import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { User } from "../models/user.js";
import { Product } from "../models/restaurant.js";
import { Cart, CartItem } from "../models/cart.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { requestHandler } from "../utils/requestHandler.js";
import { ValidationError, NotFoundError } from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { getUserIdFromToken } from "../utils/getUserIdFromToken.js";

const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const cartRepository = AppDataSource.getRepository(Cart);

export const getCart = requestHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req);

  const cart = await cartRepository.findOne({
    where: { user: { id: userId } },
    relations: ["cartItems", "cartItems.product"],
  });

  if (!cart) {
    return res.status(200).json(APIResponse.success("Cart is empty", []));
  }

  cart.cartItems.forEach((cartItem) => {
    cartItem.product.imageUrl = generateCloudinaryUrl(
      "f_auto,q_auto",
      `Products`,
      cartItem.product.imageUrl
    );
  });

  const cartData = cart.cartItems.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }));

  return res
    .status(200)
    .json(APIResponse.success("Cart retrieved successfully", cartData));
});

export const addToCart = requestHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req);
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    throw new ValidationError("Product ID and quantity are required");
  }

  let cart = await cartRepository.findOne({
    where: { user: { id: userId } },
    relations: ["cartItems", "cartItems.product"],
  });

  if (!cart) {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    cart = cartRepository.create({ user, cartItems: [] });
  }

  let cartItem = cart.cartItems.find((item) => item.product.id === productId);

  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    const product = await productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    cartItem = cartItemRepository.create({ product, quantity });
    cart.cartItems.push(cartItem);
  }

  await cartRepository.save(cart);
  return res
    .status(200)
    .json(APIResponse.success("Product added to cart successfully", cart));
});

export const removeFromCart = requestHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromToken(req);
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      throw new ValidationError("Product ID and quantity are required");
    }

    const cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartItems", "cartItems.product"],
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new NotFoundError("Cart not found or empty");
    }

    const cartItem = cart.cartItems.find(
      (item) => item.product.id === productId
    );

    if (!cartItem) {
      return res
        .status(200)
        .json(APIResponse.success("Product not found in cart", cart));
    }

    cartItem.quantity -= quantity;
    if (cartItem.quantity <= 0) {
      cart.cartItems = cart.cartItems.filter(
        (item) => item.product.id !== productId
      );
      await cartItemRepository.remove(cartItem);
    }

    await cartRepository.save(cart);
    return res
      .status(200)
      .json(APIResponse.success("Product quantity updated successfully", cart));
  }
);
