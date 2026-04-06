import type { PoolExecutor } from "../../infrastructure/database/executor.js";
import { BadRequestError } from "../../shared/errors/AppError.js";
import type { OrderItems } from "./order.schema.js";

export class OrderRepository {
  constructor(private executor: PoolExecutor) {}

  async findVariantsForUpdate(
    variantIds: string[],
    executor: PoolExecutor = this.executor
  ) {
    const result = await executor.query(
      `
    SELECT 
      pv.id, 
      pv.product_id, 
      pv.price, 
      pv.stock,
      p.seller_id
    FROM product_variants pv
    INNER JOIN products p ON pv.product_id = p.id
    WHERE pv.id = ANY($1)
    FOR UPDATE
    `,
      [variantIds]
    );

    return result.rows;
  }

  async decrementVariantStock(
    variantId: string,
    quantity: number,
    executor: PoolExecutor = this.executor
  ) {
    const result = await executor.query(
      `
      UPDATE product_variants
      SET stock = stock - $1
      WHERE id = $2
        AND stock >= $1
      `,
      [quantity, variantId]
    );

    if (result.rowCount === 0) {
      throw new BadRequestError("Stock update failed");
    }
  }

  async createOrder(
    {
      userId,
      sellerId,
      totalPrice,
    }: { userId: string; sellerId: string; totalPrice: number },
    executor: PoolExecutor = this.executor
  ) {
    const result = await executor.query(
      ` 
    INSERT INTO orders (user_id, seller_id, total_price)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
      [userId, sellerId, totalPrice]
    );

    const order = result.rows[0];

    if (!order) {
      throw new Error("Failed to create order");
    }

    return order;
  }

  async createOrderItems(
    orderId: string,
    items: OrderItems,
    executor: PoolExecutor = this.executor
  ) {
    const values: any[] = [];
    const placeholders: string[] = [];

    items.forEach((item, index) => {
      const baseIndex = index * 4;

      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
      );

      values.push(orderId, item.variantId, item.quantity, item.priceSnapshot);
    });

    const query = `
    INSERT INTO order_items (order_id, variant_id, quantity, price_snapshot)
    VALUES ${placeholders.join(", ")}
  `;

    await executor.query(query, values);
  }

  async findOrders(
    userId: string,
    limit: number,
    offset: number,
    executor: PoolExecutor = this.executor
  ) {
    const result = await executor.query(
      `
      SELECT
        id,
        status,
        total_price,
        created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    );

    return result.rows;
  }

  // async findOrderById(
  //   userId: string,
  //   orderId: string,
  //   executor: PoolExecutor = this.executor
  // ) {
  //   const result = await executor.query(`
  //     SELECT
  //       id,
  //       status,
  //       total_price,
  //       created_at

  //     FROM orders
  //     INNER JOIN order_items i ON o.id = i.order_id
  //     WHERE o.id = $1
  //       AND o.user_id = $2
  //     `);
  // }

  async findOrderById(
    userId: string,
    orderId: string,
    executor: PoolExecutor = this.executor
  ) {
    const result = await executor.query(
      `
      SELECT
        o.id,
        o.status,
        o.total_price,
        o.created_at,
        i.variant_id,
        i.quantity,
        i.price_snapshot,
        pv.attributes

      FROM orders o
      
      JOIN order_items i ON o.id = i.order_id
      JOIN product_variants pv ON pv.id = i.variant_id

      WHERE o.id = $1 
        AND o.user_id = $2
      `,
      [orderId, userId]
    );

    return result.rows;
  }
}
