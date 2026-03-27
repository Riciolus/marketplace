import type { PoolExecutor } from "../../infrastructure/database/executor.js";
import type {
  CategoriesInput,
  ImageInput,
  UpdateProductPayload,
  VariantInput,
} from "./product.schema.js";
import { NotFoundError } from "../../shared/errors/AppError.js";

export class ProductRepository {
  constructor(private executor: PoolExecutor) {}

  // ========================
  // PUBLIC PRODUCT LOGIC
  // ========================
  async findProducts(params: {
    limit: number;
    offset: number;
    categorySlug?: string;
    sellerId?: string;
  }) {
    const values: any[] = [];
    const conditions: string[] = [];
    let categoryJoin = "";

    if (params.categorySlug) {
      categoryJoin = `
      INNER JOIN product_categories pc ON pc.product_id = p.id
      INNER JOIN categories c ON pc.category_id = c.id
    `;
    }

    conditions.push(`p.status = 'active'`);

    if (params.sellerId) {
      values.push(params.sellerId);
      conditions.push(`p.seller_id = $${values.length}`);
    }

    if (params.categorySlug) {
      values.push(params.categorySlug);
      conditions.push(`c.slug = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    values.push(params.limit);
    values.push(params.offset);

    const data = await this.executor.query(
      `
      SELECT
        p.id as product_id, 
        p.seller_id,
        u.name as seller_name, 
        p.title, 
        p.slug, 
        p.status,
        pi.url,
        MIN(pv.price) AS min_price,
        MAX(pv.price) AS max_price

      FROM products AS p

      INNER JOIN users AS u ON u.id = p.seller_id 
      INNER JOIN product_variants AS pv ON pv.product_id = p.id 

      LEFT JOIN LATERAL (
        SELECT url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY position ASC
        LIMIT 1
      ) pi ON true

      ${categoryJoin}

      ${whereClause}

      GROUP BY 
        p.id,
        p.seller_id,
        p.title,
        p.slug,
        p.status,
        pi.url,
        u.name
      
      LIMIT $${values.length - 1} 
      OFFSET $${values.length}
      `,
      values
    );

    return data.rows;
  }

  async findBySlug(slug: string, executor: PoolExecutor = this.executor) {
    const product = await executor.query(
      `
      SELECT 
      p.id, 
      p.title, 
      p.slug, 
      p.description, 
      p.seller_id,
      u.name

      FROM products AS p

      INNER JOIN users AS u ON u.id = p.seller_id

      WHERE p.slug = $1
      `,
      [slug]
    );

    return product.rows[0];
  }

  async findById(productId: string, executor: PoolExecutor = this.executor) {
    const product = await executor.query(
      `
      SELECT 
      p.id, 
      p.title, 
      p.slug, 
      p.description, 
      p.seller_id,
      u.name

      FROM products AS p

      INNER JOIN users AS u ON u.id = p.seller_id

      WHERE p.id = $1`,
      [productId]
    );

    return product.rows[0] ?? null;
  }

  async findSellerIdById(productId: string, executor: PoolExecutor = this.executor) {
    const result = await executor.query(
      `
    SELECT seller_id
    FROM products
    WHERE id = $1
    `,
      [productId]
    );

    return result.rows[0]?.seller_id;
  }

  async updateProduct({
    productId,
    payload,
    slug,
    executor,
  }: {
    productId: string;
    payload: UpdateProductPayload;
    slug?: string | undefined;
    executor: PoolExecutor;
  }) {
    let fields: string[] = [];
    let values: any[] = [];

    if (payload.title) {
      values.push(payload.title);
      fields.push(`title = $${values.length}`);
    }

    if (slug) {
      values.push(slug);
      fields.push(`slug = $${values.length}`);
    }

    if (payload.description) {
      values.push(payload.description);
      fields.push(`description = $${values.length}`);
    }

    values.push(productId);

    const setClause = fields.length ? `SET ${fields.join(", ")}` : "";

    await executor.query(
      ` 
      UPDATE products
      ${setClause}
      WHERE id = $${values.length}
      `,
      values
    );
  }

  async createProduct(
    payload: {
      sellerId: string;
      title: string;
      description: string;
      slug: string;
    },
    executor: PoolExecutor
  ) {
    const { sellerId, title, description, slug } = payload;

    const product = await executor.query(
      `
    INSERT INTO products (seller_id, title, description, slug)
    VALUES ($1,$2,$3,$4)
    RETURNING id, slug
    `,
      [sellerId, title, description, slug]
    );

    return product.rows[0];
  }

  async deleteProduct(productId: string, executor: PoolExecutor = this.executor) {
    const deleted = await executor.query(
      `
      DELETE FROM products
      WHERE id = $1
      `,
      [productId]
    );

    return deleted.rows[0];
  }

  async lockProductById(productId: string, executor: PoolExecutor) {
    await executor.query(
      `
    SELECT id
    FROM products
    WHERE id = $1
    FOR UPDATE
    `,
      [productId]
    );
  }

  // ========================
  // VARIANT LOGIC
  // ========================
  async findVariants(productId: string, executor: PoolExecutor = this.executor) {
    const variants = await executor.query(
      `
      SELECT
      pv.id,
      pv.sku,
      pv.price,
      pv.stock,
      pv.attributes

      FROM product_variants AS pv

      WHERE pv.product_id = $1
      `,
      [productId]
    );

    return variants.rows;
  }

  async createVariants(
    productId: string,
    variants: VariantInput[],
    executor: PoolExecutor
  ) {
    const values: any[] = [];
    const placeholders: string[] = [];

    variants.forEach((v, i) => {
      const base = i * 4;

      placeholders.push(
        `($1, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
      );

      values.push(v.sku, v.price, v.stock, v.attributes ?? {});
    });

    await executor.query(
      `
    INSERT INTO product_variants
    (product_id, sku, price, stock, attributes)
    VALUES ${placeholders.join(",")}
    `,
      [productId, ...values]
    );
  }

  async updateVariants(
    productId: string,
    updated: VariantInput[],
    executor: PoolExecutor = this.executor
  ) {
    if (updated.length === 0) return;

    const values: any[] = [];
    const rows: string[] = [];

    updated.forEach((v, i) => {
      const baseIndex = i * 5;

      rows.push(
        `(
      $${baseIndex + 1}::uuid,
      $${baseIndex + 2}::text,
      $${baseIndex + 3}::int,
      $${baseIndex + 4}::int,
      $${baseIndex + 5}::jsonb
    )`
      );

      values.push(
        v.id, // $1
        v.sku, // $2
        v.price, // $3
        v.stock, // $4
        v.attributes ?? {} // $5
      );
    });

    const query = `
    UPDATE product_variants v
    SET 
      sku = data.sku,
      price = data.price,
      stock = data.stock,
      attributes = data.attributes,
      updated_at = NOW()
    FROM (
      VALUES
      ${rows.join(",\n")}
    ) AS data(id, sku, price, stock, attributes)
    WHERE v.id = data.id
    AND v.product_id = $${values.length + 1}
  `;

    values.push(productId);

    await executor.query(query, values);
  }

  async deleteVariants(
    productId: string,
    deletedIds: string[],
    executor: PoolExecutor = this.executor
  ) {
    if (deletedIds.length === 0) return;

    await executor.query(
      `
    DELETE FROM product_variants
    WHERE product_id = $1
    AND id = ANY($2)
    `,
      [productId, deletedIds]
    );
  }

  async syncProductVariants(
    productId: string,
    incomingVariants: VariantInput[],
    executor: PoolExecutor
  ) {
    const existing = await this.findVariants(productId, executor);

    // id -> variant
    const existingMap = new Map(existing.map((v) => [v.id, v]));

    const inserted: VariantInput[] = [];
    const updated: VariantInput[] = [];

    for (const incoming of incomingVariants) {
      // NEW VARIANT → INSERT
      if (!incoming.id) {
        inserted.push(incoming);
        continue;
      }

      const existingVariant = existingMap.get(incoming.id);

      if (!existingVariant) {
        // optional safety check
        throw new Error(`Variant ${incoming.id} not found`);
      }

      // detect changes
      const changed =
        existingVariant.price !== incoming.price ||
        existingVariant.stock !== incoming.stock ||
        JSON.stringify(existingVariant.attributes) !==
          JSON.stringify(incoming.attributes) ||
        existingVariant.sku !== incoming.sku;

      if (changed) {
        updated.push(incoming);
      }

      // remove so remaining = deleted
      existingMap.delete(incoming.id);
    }

    // everything left in map = deleted
    const deleted = Array.from(existingMap.keys());

    if (inserted.length > 0) {
      await this.createVariants(productId, inserted, executor);
    }

    if (updated.length > 0) {
      await this.updateVariants(productId, updated, executor);
    }

    if (deleted.length > 0) {
      await this.deleteVariants(productId, deleted, executor);
    }
  }

  // ========================
  // IMAGE LOGIC
  // =======================

  async findImages(productId: string, executor: PoolExecutor = this.executor) {
    const images = await executor.query(
      `
      SELECT
      pi.id,
      pi.url,
      pi.position

      FROM product_images AS pi

      WHERE pi.product_id = $1
      `,
      [productId]
    );

    return images.rows;
  }

  async createImages(
    productId: string,
    images: ImageInput[],
    executor: PoolExecutor = this.executor
  ) {
    for (const image of images) {
      await executor.query(
        `
      INSERT INTO product_images
      (product_id, url, position)
      VALUES ($1, $2, $3)
      `,
        [productId, image.url, image.position]
      );
    }
  }

  async updateImages(
    productId: string,
    images: ImageInput[],
    executor: PoolExecutor = this.executor
  ) {
    for (const img of images) {
      await executor.query(
        `
      UPDATE product_images
      SET position = $1, url = $2
      WHERE id = $3
      AND product_id = $4
      `,
        [img.position, img.url, img.id, productId]
      );
    }
  }

  async deleteImages(
    productId: string,
    imagesIds: string[],
    executor: PoolExecutor = this.executor
  ) {
    await executor.query(
      `
      DELETE FROM product_images
      WHERE product_id = $1
      AND id = ANY($2)
      `,
      [productId, imagesIds]
    );
  }

  async syncProductImages(
    productId: string,
    incomingImages: ImageInput[],
    executor: PoolExecutor = this.executor
  ) {
    const existingImages = await this.findImages(productId, executor);
    const existingImageIds = existingImages.map((img) => img.id);
    const existingMap = new Map(existingImages.map((img) => [img.id, img]));
    const incomingImageIds = incomingImages.map((img) => img.id);

    const existingSet = new Set(existingImageIds);
    const incomingSet = new Set(incomingImageIds);

    const deletedId = existingImageIds.filter((id) => !incomingSet.has(id));
    const inserted = incomingImages.filter((img) => !existingSet.has(img.id));
    const updated = incomingImages.filter((img) => {
      const existing = existingMap.get(img.id);
      if (!existing) return false;

      return existing.position !== img.position || existing.url !== img.url;
    });

    if (inserted.length > 0) {
      await this.createImages(productId, inserted, executor);
    }

    if (deletedId.length > 0) {
      await this.deleteImages(productId, deletedId, executor);
    }

    if (updated.length > 0) {
      await this.updateImages(productId, updated, executor);
    }
  }

  // ========================
  // CATEGORY LOGIC
  // ======================
  async findCategories(productId: string, executor: PoolExecutor = this.executor) {
    const categories = await executor.query(
      `
      SELECT
      pc.category_id,
      c.name,
      c.slug,
      c.parent_id

      FROM product_categories AS pc

      INNER JOIN categories AS c ON c.id = pc.category_id

      WHERE pc.product_id = $1
      `,
      [productId]
    );

    return categories.rows;
  }

  async findCategoryIdsBySlug(
    slug: string[],
    executor: PoolExecutor = this.executor
  ) {
    const ids = await executor.query(
      `
      SELECT id
      FROM categories
      WHERE slug = ANY($1)
      `,
      [slug]
    );

    return ids.rows.map((row) => row.id);
  }

  async createCategories(
    productId: string,
    categoryIds: string[],
    executor: PoolExecutor
  ) {
    const values: unknown[] = [productId];
    const placeholders: string[] = [];

    categoryIds.forEach((id, i) => {
      values.push(id);
      placeholders.push(`($1, $${i + 2})`);
    });

    await executor.query(
      `
    INSERT INTO product_categories (product_id, category_id)
    VALUES ${placeholders.join(",")}
    ON CONFLICT (product_id, category_id) DO NOTHING
    `,
      values
    );
  }

  async deleteCategories(
    productId: string,
    categoryIds: string[],
    executor: PoolExecutor
  ) {
    await executor.query(
      `
    DELETE FROM product_categories
    WHERE product_id = $1
    AND category_id = ANY($2)
    `,
      [productId, categoryIds]
    );
  }

  async syncProductCategories(
    productId: string,
    inputCategories: CategoriesInput,
    executor: PoolExecutor
  ) {
    const existingCategory = await this.findCategories(productId, executor);
    const existingCategoryIds = existingCategory.map((ctg) => ctg.id);

    const incomingCategoryIds = await this.findCategoryIdsBySlug(inputCategories);

    if (incomingCategoryIds.length !== inputCategories.length)
      throw new NotFoundError("Categories not found");

    const existingSet = new Set(existingCategoryIds);
    const incomingSet = new Set(incomingCategoryIds);

    const deleted = existingCategoryIds.filter((ctg) => !incomingSet.has(ctg));
    const inserted = Array.from(incomingSet).filter((ctg) => !existingSet.has(ctg));

    if (inserted.length > 0)
      await this.createCategories(productId, inserted, executor);
    if (deleted.length > 0)
      await this.deleteCategories(productId, deleted, executor);
  }
}

// havent implement order yett, disabled
// async existInOrderItems(productId: string) {
//   const data = this.executor.query(`
//     SELECT

//     FROM
//     `);
// }
