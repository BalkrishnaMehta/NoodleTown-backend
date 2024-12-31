import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { Restaurant, Category, ServiceType } from "../models/restaurant.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { stringFormatter } from "../utils/stringFormatter.js";
import { Any, ArrayContains, In, Raw } from "typeorm";
import { Recommendation } from "../models/recommendation.js";
import { ValidationError, NotFoundError } from "../models/error.js";
import { APIResponse } from "../utils/APIResponse.js";
import { requestHandler } from "../utils/requestHandler.js";

const restaurantRepository = AppDataSource.getRepository(Restaurant);
const categoryRepository = AppDataSource.getRepository(Category);
const recommendationRepository = AppDataSource.getRepository(Recommendation);

export const addRestaurant = requestHandler(
  async (req: Request, res: Response) => {
    const { restaurant } = req.body;
    if (!restaurant) {
      throw new ValidationError("restaurant data is required");
    }
    const savedRestaurant = await restaurantRepository.save(restaurant);
    return res
      .status(200)
      .json(
        APIResponse.success("Restaurant added successfully", savedRestaurant)
      );
  }
);

export const getRestaurants = requestHandler(
  async (req: Request, res: Response) => {
    const restaurants = await restaurantRepository.find({
      select: {
        id: true,
        title: true,
        logo: true,
      },
    });

    const updatedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      logo: generateCloudinaryUrl(
        "f_auto,q_auto",
        `Restaurants/${stringFormatter(restaurant.title)}`,
        restaurant.logo
      ),
    }));

    return res.status(200).json(updatedRestaurants);
  }
);

export const getRestaurantDetails = requestHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const restaurant = await restaurantRepository.findOne({ where: { id } });

    if (!restaurant) {
      throw new NotFoundError("Restaurant with this id does not exist");
    }

    restaurant.logo = generateCloudinaryUrl(
      "f_auto,q_auto",
      `Restaurants/${stringFormatter(restaurant.title)}`,
      restaurant.logo
    );

    if (restaurant.coverImages && Array.isArray(restaurant.coverImages)) {
      restaurant.coverImages = restaurant.coverImages.map((image) =>
        generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(restaurant.title)}/cover`,
          image
        )
      );
    }

    if (restaurant.menuImages && Array.isArray(restaurant.menuImages)) {
      restaurant.menuImages = restaurant.menuImages.map((image) =>
        generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(restaurant.title)}/menu`,
          image
        )
      );
    }

    return res.status(200).json(restaurant);
  }
);

export const getCategorizedProducts = requestHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const categories = await categoryRepository.find({
      where: { restaurant: { id } },
      relations: ["products"],
    });

    const recommendedProducts = await recommendationRepository.find({
      where: { restaurant: { id } },
      select: ["product"],
      relations: ["product"],
      order: { order: "ASC" },
    });

    if (recommendedProducts.length > 0) {
      const restaurant = await restaurantRepository.findOne({ where: { id } });

      if (!restaurant) {
        throw new NotFoundError("Restaurant with this id does not exist");
      }

      const recommendedCategory = {
        id: "recommended",
        name: "Recommended",
        products: recommendedProducts.map(
          (recommendation) => recommendation.product
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      categories.unshift(recommendedCategory as unknown as Category);
    }

    categories.forEach((category) => {
      if (category.products) {
        category.products = category.products.map((product) => ({
          ...product,
          imageUrl: generateCloudinaryUrl(
            "f_auto,q_auto",
            "Products",
            product.imageUrl
          ),
        }));
      }
    });

    return res.status(200).json(categories);
  }
);

export const getRestaurantsByServiceType = requestHandler(
  async (req: Request, res: Response) => {
    const { type } = req.params;

    if (!type || !Object.values(ServiceType).includes(type as ServiceType)) {
      throw new ValidationError("Invalid service type");
    }

    const restaurants = await restaurantRepository.find({
      where: { serviceTypes: ArrayContains([type]) },
    });

    const updatedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      logo: generateCloudinaryUrl(
        "f_auto,q_auto",
        `Restaurants/${stringFormatter(restaurant.title)}`,
        restaurant.logo
      ),
    }));

    return res.status(200).json(updatedRestaurants);
  }
);

export const getRestaurantsByCuisine = requestHandler(
  async (req: Request, res: Response) => {
    const { cuisine } = req.params;

    if (!cuisine) {
      throw new ValidationError("Please provide cuisine");
    }

    const restaurants = await restaurantRepository.find({
      where: {
        tags: Raw((alias) => `${alias} @> :cuisine::text[]`, {
          cuisine: [cuisine],
        }),
      },
    });

    const updatedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      logo: generateCloudinaryUrl(
        "f_auto,q_auto",
        `Restaurants/${stringFormatter(restaurant.title)}`,
        restaurant.logo
      ),
    }));

    return res.status(200).json(updatedRestaurants);
  }
);

export const addRecommendationForRestaurant = requestHandler(
  async (req: Request, res: Response) => {
    const restaurantId = req.params.id;
    const { productId, order } = req.body;

    if (!productId || !order || order <= 0 || order > 4) {
      throw new ValidationError("Order must be between 1 and 4");
    }

    const match = await restaurantRepository.findOne({
      where: {
        id: restaurantId,
        categories: {
          products: {
            id: productId,
          },
        },
      },
      relations: ["categories", "categories.products"],
    });

    if (!match) {
      throw new NotFoundError("Product not found in this restaurant");
    }

    let recommendations = await recommendationRepository.find({
      where: { restaurant: { id: restaurantId } },
      relations: ["product"],
      order: { order: "ASC" },
    });

    const existingRec = recommendations.find(
      (rec) => rec.product.id === productId
    );

    if (existingRec) {
      if (existingRec.order === order) {
        return res.status(200).json(
          APIResponse.success("Recommendation already exists at this order", {
            recommendations,
          })
        );
      }

      const targetRec = recommendations.find((rec) => rec.order === order);

      if (targetRec) {
        const tempOrder = existingRec.order;
        existingRec.order = order;
        targetRec.order = tempOrder;

        await recommendationRepository.save([existingRec, targetRec]);
      } else {
        existingRec.order = order;
        await recommendationRepository.save(existingRec);
      }
    } else {
      for (const rec of recommendations) {
        if (rec.order >= order) {
          rec.order += 1;
        }
      }

      const newRecommendation = recommendationRepository.create({
        restaurant: { id: restaurantId },
        product: { id: productId },
        order,
      });
      recommendations.push(newRecommendation);

      recommendations.sort((a, b) => a.order - b.order);

      if (recommendations.length > 4) {
        const lastRec = recommendations[recommendations.length - 1];
        recommendations = recommendations.slice(0, 4);
        await recommendationRepository.remove(lastRec);
      }

      await recommendationRepository.save(recommendations);
    }

    const finalRecommendations = await recommendationRepository.find({
      where: { restaurant: { id: restaurantId } },
      relations: ["product"],
      order: { order: "ASC" },
    });

    return res.status(201).json(
      APIResponse.success("Recommendation updated successfully", {
        recommendations: finalRecommendations,
      })
    );
  }
);
