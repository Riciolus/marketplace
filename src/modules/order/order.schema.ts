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
