import { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import Coupon, { CouponType } from "../models/coupon.js";
import { APIResponse } from "../utils/APIResponse.js";
import { ValidationError, NotFoundError } from "../models/error.js";
import { requestHandler } from "../utils/requestHandler.js";

const couponRepository = AppDataSource.getRepository(Coupon);

export const validateCoupon = requestHandler(
  async (req: Request, res: Response) => {
    const { couponCode, orderTotal } = req.body;

    const coupon = await couponRepository.findOne({ where: { couponCode } });
    if (!coupon) {
      throw new NotFoundError("Invalid Coupon.");
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      throw new ValidationError("Coupon has expired.");
    }

    if (orderTotal < coupon.minPurchase) {
      throw new ValidationError(
        `At least ₹${coupon.minPurchase} Order total required.`
      );
    }

    let discountAmount = 0;
    let message = "";

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = Math.min(
        (orderTotal * coupon.amount) / 100,
        coupon.maxDiscount || Infinity
      );
      message = "Maximum discount applied.";
    } else if (coupon.type === CouponType.FLAT) {
      discountAmount = coupon.amount;
      message = "Coupon applied successfully.";
    }

    return res.status(200).json(
      APIResponse.success("Coupon validated successfully", {
        couponCode,
        discountType: coupon.type,
        discountValue: coupon.amount,
        discountAmount,
        message,
      })
    );
  }
);

export const addCoupon = requestHandler(async (req: Request, res: Response) => {
  const coupon: Coupon = req.body;

  const savedCoupon = await couponRepository.save(coupon);

  return res.status(201).json(
    APIResponse.success("Coupon added successfully", {
      coupon: savedCoupon,
    })
  );
});
