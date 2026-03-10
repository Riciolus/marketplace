import { exec } from "node:child_process";
import type { PoolExecutor } from "../../infrastructure/database/executor.js";

export class ProductRepository {
  constructor(private executor: PoolExecutor) {}

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

  async findBySlug(slug: string) {
    const product = await this.executor.query(
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

  async findVariants(productId: string) {
    const variants = await this.executor.query(
      `
      SELECT
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

  async findImages(productId: string) {
    const images = await this.executor.query(
      `
      SELECT
      pi.url,
      pi.position

      FROM product_images AS pi

      WHERE pi.product_id = $1
      `,
      [productId]
    );

    return images.rows;
  }

  async findCategories(productId: string) {
    const categories = await this.executor.query(
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
}
