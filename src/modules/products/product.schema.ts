import z from "zod";

export const productListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  category: z.string().optional(),

  sellerId: z.string().uuid().optional(),
});

export type GetProductsQuery = z.infer<typeof productListSchema>;
