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

    if (params.sellerId) {
      values.push(params.sellerId);
      conditions.push(`u.id = $${values.length}`);
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
        p.title, 
        p.description, 
        p.slug, 
        p.status, 
        p.created_at,
        u.email,
        pv.id AS variant_id,
        pv.sku,
        pv.price,
        pv.stock,
        pv.attributes

      FROM products AS p

      INNER JOIN users AS u ON p.seller_id = u.id
      INNER JOIN product_variants AS pv ON p.id = pv.product_id
      INNER JOIN product_categories AS pc ON pc.product_id = p.id
      INNER JOIN categories AS c ON pc.category_id = c.id

      ${whereClause}
      
      LIMIT $${values.length - 1} OFFSET $${values.length}
      `,
      values
    );

    return data.rows;
  }
}
