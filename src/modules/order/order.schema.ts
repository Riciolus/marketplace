import { z } from "zod";

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export const orderItemsSchema = z.array(
  z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
    priceSnapshot: z.number().int().positive(),
  })
);

export type OrderItems = z.infer<typeof orderItemsSchema>;

export const getOrdersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
