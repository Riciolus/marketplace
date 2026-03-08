import type { CategoryRepository } from "./categories/category.repository.js";
import type { ImageRepository } from "./images/image.repository.js";
import type { ProductRepository } from "./product.repository.js";
import type { VariantRepository } from "./variants/variant.repository.js";

export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    variantRepo: VariantRepository,
    categoryRepo: CategoryRepository,
    imageRepo: ImageRepository
  ) {}
}
