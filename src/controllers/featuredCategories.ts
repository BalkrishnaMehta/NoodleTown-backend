import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Product } from "../models/restaurant.js";
import { Order, Statuses } from "../models/user.js";
import { Between } from "typeorm";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { Authentic } from "../models/authentic.js";
import { APIResponse } from "../utils/APIResponse.js";
import { ValidationError } from "../models/error.js";
import { requestHandler } from "../utils/requestHandler.js";
import { paginate } from "../utils/paginate.js";

const productRepository = AppDataSource.getRepository(Product);
const orderRepository = AppDataSource.getRepository(Order);
const authenticRepository = AppDataSource.getRepository(Authentic);

export const getProductsByFeaturedCategories = requestHandler(
  async (req: Request, res: Response) => {
    const category = req.params.category;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 12;
    let paginatedResult;

    if (category === "Veggie-Friendly") {
      paginatedResult = await paginate(
        productRepository,
        {
          isVeg: true,
        },
        page,
        limit
      );
    } else if (category === "Trending-this-week") {
      const orders = await orderRepository.find({
        where: {
          status: Statuses.DELIVERED,
          createdAt: Between(
            new Date(new Date().setDate(new Date().getDate() - 7)),
            new Date()
          ),
        },
      });

      const aggregatedProducts = orders.reduce((acc, order) => {
        order.products.forEach(
          ({ product, quantity }: { product: Product; quantity: number }) => {
            acc[product.id] = (acc[product.id] || 0) + quantity;
          }
        );
        return acc;
      }, {} as Record<string, number>);

      const sortedProductIds = Object.entries(aggregatedProducts)
        .sort((a, b) => b[1] - a[1])
        .map(([productId]) => productId);

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedIds = sortedProductIds.slice(startIndex, endIndex);

      const products = [];
      for (const productId of paginatedIds) {
        const product = await productRepository.findOne({
          where: { id: productId },
        });
        if (product) {
          products.push(product);
        }
      }

      paginatedResult = {
        totalRecords: sortedProductIds.length,
        page,
        limit,
        totalPages: Math.ceil(sortedProductIds.length / limit),
        results: products,
      };
    } else if (category === "Authentic") {
      const paginatedAuthentic = await paginate(
        authenticRepository,
        {},
        page,
        limit,
        ["product"]
      );

      const products = paginatedAuthentic.results.map(
        (authenticProduct) => authenticProduct.product
      );

      paginatedResult = {
        ...paginatedAuthentic,
        results: products,
      };
    } else {
      throw new ValidationError("Incorrect category");
    }

    paginatedResult.results.forEach((product) => {
      product.imageUrl = generateCloudinaryUrl(
        "f_auto,q_auto",
        `Products`,
        product.imageUrl
      );
    });

    return res
      .status(200)
      .json(
        APIResponse.success("Products fetched successfully", paginatedResult)
      );
  }
);

export const addAuthenticProduct = requestHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.body;

    if (!productId) {
      throw new ValidationError("Product Id is required");
    }

    const authenticProduct = authenticRepository.create({
      product: { id: productId },
    });

    await authenticRepository.save(authenticProduct);

    return res
      .status(201)
      .json(
        APIResponse.success(
          "Authentic Product added successfully",
          authenticProduct,
          201
        )
      );
  }
);
