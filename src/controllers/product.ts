import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Restaurant, Category, Product } from "../models/restaurant.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { ILike, In } from "typeorm";
import { NotFoundError, ValidationError } from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { requestHandler } from "../utils/requestHandler.js";

const restaurantRepository = AppDataSource.getRepository(Restaurant);
const categoryRepository = AppDataSource.getRepository(Category);
const productRepository = AppDataSource.getRepository(Product);

export const addProduct = requestHandler(
  async (req: Request, res: Response) => {
    const { restaurantId, categoryName, productDetails } = req.body;

    const restaurant = await restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError(`Restaurant with ID ${restaurantId} not found`);
    }

    let category = await categoryRepository.findOne({
      where: { name: categoryName, restaurant: { id: restaurantId } },
    });

    if (!category) {
      category = categoryRepository.create({
        name: categoryName,
        restaurant: restaurant,
      });
      await categoryRepository.save(category);
    }

    productDetails.category = category;
    const product = await productRepository.save(productDetails);

    return res
      .status(201)
      .json(APIResponse.success("Product added successfully", { product }));
  }
);

export const addProducts = requestHandler(
  async (req: Request, res: Response) => {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      throw new ValidationError("Invalid products data");
    }

    for (const { restaurantId, categoryName, productDetails } of products) {
      const restaurant = await restaurantRepository.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundError(`Restaurant with ID ${restaurantId} not found`);
      }

      let category = await categoryRepository.findOne({
        where: { name: categoryName, restaurant: { id: restaurantId } },
      });

      if (!category) {
        category = categoryRepository.create({
          name: categoryName,
          restaurant: restaurant,
        });
        await categoryRepository.save(category);
      }

      const product = productRepository.create({
        ...productDetails,
        category: category,
      });

      await productRepository.save(product);
    }

    return res
      .status(201)
      .json(APIResponse.success("Products added successfully"));
  }
);

export const getProductDetails = requestHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    product.imageUrl = generateCloudinaryUrl(
      "f_auto,q_auto",
      "Products",
      product.imageUrl
    );

    return res
      .status(200)
      .json(
        APIResponse.success("Product details retrieved successfully", product)
      );
  }
);

export const getPopularCategories = requestHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryRepository.find({
      select: ["id", "name"],
    });

    if (!categories.length) {
      throw new NotFoundError("No categories found");
    }

    const categoryProductCounts: Record<string, number> = {};

    for (const category of categories) {
      const productCount = await productRepository.count({
        where: { category: { id: category.id } },
      });
      categoryProductCounts[category.id] = productCount;
    }

    const categoryGroups: Record<
      string,
      { id: string; name: string; count: number }[]
    > = {};
    const processedWords = new Set<string>();

    for (const category of categories) {
      const normalizedWords = category.name
        .toLowerCase()
        .split(" ")
        .filter((word) => word.trim());

      let foundGroup = false;

      for (const word of normalizedWords) {
        if (processedWords.has(word)) {
          const groupKey = Object.keys(categoryGroups).find((key) =>
            key.includes(word)
          );
          if (groupKey) {
            categoryGroups[groupKey].push({
              id: category.id,
              name: category.name,
              count: categoryProductCounts[category.id],
            });
            foundGroup = true;
            break;
          }
        }
      }

      if (!foundGroup) {
        const newKey = normalizedWords.join(" ");
        categoryGroups[newKey] = [
          {
            id: category.id,
            name: category.name,
            count: categoryProductCounts[category.id],
          },
        ];
        normalizedWords.forEach((word) => processedWords.add(word));
      }
    }

    const groupProductCounts = Object.entries(categoryGroups).map(
      ([key, group]) => {
        const totalProducts = group.reduce(
          (sum, category) => sum + category.count,
          0
        );
        return { key, group, totalProducts };
      }
    );

    const topGroups = groupProductCounts
      .sort((a, b) => b.totalProducts - a.totalProducts)
      .slice(0, 5);

    const popularCategoriesWithProducts: Record<string, any[]> = {};

    for (const { key, group } of topGroups) {
      const categoryIds = group.map((category) => category.id);

      const products = await productRepository.find({
        where: { category: { id: In(categoryIds) } },
        // take: 10,
      });

      products.forEach((product) => {
        product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          `Products`,
          product.imageUrl
        );
      });

      popularCategoriesWithProducts[key] = products;
    }

    return res
      .status(200)
      .json(
        APIResponse.success(
          "Popular categories retrieved successfully",
          popularCategoriesWithProducts
        )
      );
  }
);

export const getSeasonalProducts = requestHandler(
  async (req: Request, res: Response) => {
    const month = new Date().getMonth();
    let season = "Winter%";

    if (month > 1 && month < 6) {
      season = "Summer%";
    } else if (month > 5 && month < 10) {
      season = "Monsoon%";
    }

    const products = await productRepository.find({
      where: { seasonalTag: ILike(season) },
    });

    products.forEach((product) => {
      product.imageUrl = generateCloudinaryUrl(
        "f_auto,q_auto",
        "Products",
        product.imageUrl
      );
    });

    return res.status(200).json(
      APIResponse.success("Seasonal products retrieved successfully", {
        products,
      })
    );
  }
);
