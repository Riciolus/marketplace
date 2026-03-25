import z from "zod";

export const productListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  category: z.string().optional(),

  sellerId: z.string().uuid().optional(),
});

export const productSlugParamSchema = z.object({
  slug: z.string(),
});

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),

  categories: z.array(z.string()).min(1),

  variants: z
    .array(
      z.object({
        sku: z.string(),
        price: z.number().int().positive(),
        stock: z.number().int().nonnegative(),
        attributes: z.record(z.string(), z.string()).optional(),
      })
    )
    .min(1),

  images: z
    .array(
      z.object({
        url: z.string().url(),
        position: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type Variants = CreateProductPayload["variants"][number];
export type Categories = CreateProductPayload["categories"];
export type Images = CreateProductPayload["images"];

export type GetProductsQuery = z.infer<typeof productListSchema>;

export const deleteProductParamSchema = z.object({
  id: z.string().uuid(),
});
