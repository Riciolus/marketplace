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

    const map = new Map();

    for (const row of products) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          title: row.title,
          description: row.description,
          slug: row.slug,
          seller: {
            id: row.seller_id,
            email: row.email,
          },
          variants: [],
        });
      }

      map.get(row.product_id).variants.push({
        sku: row.sku,
        price: row.price,
        stock: row.stock,
        attributes: row.attributes,
      });
    }

    return {
      data: Array.from(map.values()),
      meta: {
        page,
        limit,
      },
    };
  }
}
