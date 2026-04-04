import z from "zod";

export const variantSchema = z.object({
  id: z.string().uuid().optional(), // important for update
  sku: z.string(),
  price: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  attributes: z.record(z.string(), z.string()).optional(),
});

export const imageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url(),
  position: z.number().int().nonnegative(),
});

export const productListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  category: z.string().optional(),

  sellerId: z.string().uuid().optional(),
});
export type GetProductsQuery = z.infer<typeof productListSchema>;

export const productSlugParamSchema = z.object({
  slug: z.string(),
});

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),

  categories: z.array(z.string()).min(1),

  variants: z.array(variantSchema).min(1),

  images: z.array(imageSchema).optional(),
});
export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type CategoriesInput = CreateProductPayload["categories"];
export type ImageInput = z.infer<typeof imageSchema>;
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;

export const deleteProductParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductParamsSchema = z.object({
  id: z.string().uuid(),
});
