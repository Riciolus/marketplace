import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors/AppError.js";
import type { ProductRepository } from "./product.repository.js";
import type {
  CreateProductPayload,
  GetProductsQuery,
  UpdateProductPayload,
} from "./product.schema.js";
import { generateSlug } from "../../shared/utils/generate-slug.js";
import { withTransaction } from "../../infrastructure/database/transaction.js";

export class ProductService {
  constructor(private repo: ProductRepository) {}

  async getProducts(query: GetProductsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const offset = (page - 1) * limit;

    const products = await this.repo.findProducts({
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
    const product = await this.repo.findBySlug(slug);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const [variants, images, categories] = await Promise.all([
      this.repo.findVariants(product.id),
      this.repo.findImages(product.id),
      this.repo.findCategories(product.id),
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

  async createProduct(userId: string, payload: CreateProductPayload) {
    return withTransaction(async (executor) => {
      let slug = generateSlug(payload.title);

      const slugExist = await this.repo.findBySlug(slug, executor);

      if (slugExist) {
        slug = `${slug}-${Date.now()}`;
      }

      const product = await this.repo.createProduct(
        {
          sellerId: userId,
          title: payload.title,
          description: payload.description,
          slug,
        },
        executor
      );

      if (!product) {
        throw new Error("Failed to create product");
      }

      await this.repo.createVariants(product.id, payload.variants, executor);

      if (payload.images) {
        await this.repo.createImages(product.id, payload.images, executor);
      }

      const categoryIds = await this.repo.findCategoryIdsBySlug(
        payload.categories,
        executor
      );

      await this.repo.createCategories(product.id, categoryIds, executor);

      return product;
    });
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await this.repo.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (product.seller_id !== userId) {
      throw new ForbiddenError("Not your product");
    }

    await withTransaction(async (executor) => {
      await this.repo.deleteProduct(product.id, executor);
    });

    // havent implement order yet, disabled and skipped for now
    // const hasOrders = await this.repo.existsInOrderItems(productId);
  }

  async updateProduct(
    userId: string,
    productId: string,
    payload: UpdateProductPayload
  ) {
    await withTransaction(async (executor) => {
      await this.repo.lockProductById(productId, executor);

      const productSellerId = await this.repo.findSellerIdById(productId, executor);

      if (!productSellerId) {
        throw new NotFoundError("Product not found");
      }

      if (productSellerId !== userId) {
        throw new UnauthorizedError("Not your product");
      }

      if (payload.title || payload.description) {
        let slug: string | undefined;

        if (payload.title) {
          const baseSlug = generateSlug(payload.title);

          const slugExist = await this.repo.findBySlug(baseSlug, executor);

          slug = slugExist ? `${baseSlug}-${Date.now()}` : baseSlug;
        }

        await this.repo.updateProduct({
          productId,
          payload,
          slug,
          executor,
        });
      }

      if (payload.categories) {
        await this.repo.syncProductCategories(
          productId,
          payload.categories,
          executor
        );
      }

      if (payload.variants) {
        await this.repo.syncProductVariants(productId, payload.variants, executor);
      }

      if (payload.images) {
        await this.repo.syncProductImages(productId, payload.images, executor);
      }
    });
    return { userId, productId };
  }
}
