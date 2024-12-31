import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Restaurant } from "../models/restaurant.js";
import Fuse from "fuse.js";
import { ILike } from "typeorm";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { stringFormatter } from "../utils/stringFormatter.js";
import { ValidationError, NotFoundError } from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { requestHandler } from "../utils/requestHandler.js";

const restaurantRepository = AppDataSource.getRepository(Restaurant);

export const getSearchResults = requestHandler(
  async (req: Request, res: Response) => {
    const city = req.params.city;
    const query = req.query.query as string;
    const limit = 5;

    if (!query || query.trim() === "") {
      throw new ValidationError("Search query cannot be empty.");
    }

    const data = await restaurantRepository.find({
      where: { address: ILike(`%${city}%`) },
      relations: ["categories", "categories.products"],
    });

    if (data.length === 0) {
      throw new NotFoundError(`No restaurants found in the city: ${city}`);
    }

    const fuseOptions = {
      isCaseSensitive: false,
      includeScore: true,
      shouldSort: true,
      keys: ["title", "categories.name", "categories.products.title"],
      threshold: 0.4,
    };

    const fuse = new Fuse(data, fuseOptions);

    const searchResults = fuse.search(query);

    const processedResults = new Map<string, any>();

    searchResults.forEach((result) => {
      const item = result.item;

      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        result.item.logo = generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(result.item.title)}`,
          result.item.logo
        );
        processedResults.set(item.id, { ...result, type: "restaurant" });
      }

      item.categories.forEach((category) => {
        if (
          category.name.toLowerCase().includes(query.toLowerCase()) &&
          !processedResults.has(category.id)
        ) {
          processedResults.set(category.id, {
            ...result,
            item: category,
            type: "category",
          });
        }

        category.products.forEach((product) => {
          product.imageUrl = generateCloudinaryUrl(
            "f_auto,q_auto",
            `Products`,
            product.imageUrl
          );
          if (
            product.title.toLowerCase().includes(query.toLowerCase()) &&
            !processedResults.has(product.id)
          ) {
            processedResults.set(product.id, {
              ...result,
              item: product,
              type: "product",
            });
          }
        });
      });
    });

    const finalResults = Array.from(processedResults.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((result) => ({
        item: result.item,
        score: result.score,
        type: result.type,
      }));

    return res
      .status(200)
      .json(APIResponse.success("Search results", finalResults));
  }
);
