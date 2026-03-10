import type { CategoryRepository } from "./categories/category.repository.js";
import type { ImageRepository } from "./images/image.repository.js";
import type { ProductRepository } from "./product.repository.js";
import type { GetProductsQuery } from "./product.schema.js";
import type { VariantRepository } from "./variants/variant.repository.js";

export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    variantRepo: VariantRepository,
    categoryRepo: CategoryRepository,
    imageRepo: ImageRepository
  ) {}

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
    }));

    return {
      data: transformedProducts,
      meta: {
        page,
        limit,
      },
    };
  }
}
