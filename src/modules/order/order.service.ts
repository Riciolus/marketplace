import { withTransaction } from "../../infrastructure/database/transaction.js";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError.js";
import type { OrderRepository } from "./order.repository.js";
import type { CheckoutPayload } from "./order.schema.js";

export class OrderService {
  constructor(private repo: OrderRepository) {}

  async checkout(userId: string, payload: CheckoutPayload) {
    return withTransaction(async (executor) => {
      const mergedItemsMap = new Map<string, number>();

      for (const item of payload.items) {
        mergedItemsMap.set(
          item.variantId,
          (mergedItemsMap.get(item.variantId) || 0) + item.quantity
        );
      }

      const mergedItems = Array.from(mergedItemsMap.entries()).map(
        ([variantId, quantity]) => ({ variantId, quantity })
      );

      const variantIds = mergedItems.map((i) => i.variantId).sort();

      // lock
      const variants = await this.repo.findVariantsForUpdate(variantIds, executor);

      if (variants.length !== variantIds.length) {
        throw new NotFoundError("Some variants not found");
      }

      // Map for fast lookup
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // validate stock
      for (const item of mergedItems) {
        const variant = variantMap.get(item.variantId);

        if (variant?.stock < item.quantity) {
          throw new BadRequestError("Insufficient stock");
        }
      }

      // same sellerId validation
      const sellerIds = new Set(variants.map((v) => v.seller_id));

      if (sellerIds.size > 1) {
        throw new BadRequestError("All items must be from the same seller");
      }

      // calculate total
      let total = 0;

      for (const item of mergedItems) {
        const variant = variantMap.get(item.variantId)!;

        total += Number(variant.price) * item.quantity;
      }

      // deduct stock
      for (const item of mergedItems) {
        await this.repo.decrementVariantStock(
          item.variantId,
          item.quantity,
          executor
        );
      }

      // create order
      const sellerId = variants[0]!.seller_id;

      const order = await this.repo.createOrder(
        { userId, sellerId, totalPrice: total },
        executor
      );

      // create order items
      const orderItems = mergedItems.map((item) => {
        const variant = variantMap.get(item.variantId)!;

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          priceSnapshot: Number(variant.price),
        };
      });

      await this.repo.createOrderItems(order.id, orderItems, executor);

      return {
        order: { id: order.id, status: "pending", totalPrice: total },
      };
    });
  }

  async getOrders(userId: string, limit: number, offset: number) {
    return await this.repo.findOrders(userId, limit, offset);
  }
}
