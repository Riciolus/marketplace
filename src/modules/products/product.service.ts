import { NotFoundError } from "../../shared/errors/AppError.js";
import type { ProductRepository } from "./product.repository.js";
import type { GetProductsQuery } from "./product.schema.js";

export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async getProducts(query: GetProductsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const offset = (page - 1) * limit;

    const products = await this.productRepo.findProducts({
      limit,
      offset,
      ...(query.category && { categorySlug: query.category }),
      ...(query.sellerId && { sellerId: query.sellerId }),
    });

    const transformedProducts = products.map((row) => ({
      id: row.product_id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      minPrice: row.min_price,
      maxPrice: row.max_price,

      seller: {
        id: row.seller_id,
        name: row.seller_name,
      },

      images: row.url
        ? {
            url: row.url,
            position: row.position,
          }
        : null,
    }));

    return {
      data: transformedProducts,
      meta: {
        page,
        limit,
      },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepo.findBySlug(slug);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const [variants, images, categories] = await Promise.all([
      this.productRepo.findVariants(product.id),
      this.productRepo.findImages(product.id),
      this.productRepo.findCategories(product.id),
    ]);

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,

      seller: {
        id: product.seller_id,
        name: product.seller_name,
      },

      variants,
      images,
      categories,
    };
  }
}
