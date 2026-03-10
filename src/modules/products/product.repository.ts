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
      SELECT DISTINCT
        p.id as product_id, 
        p.seller_id, 
        p.title, 
        p.slug, 
        p.status

      FROM products AS p

      ${categoryJoin}

      ${whereClause}
      
      LIMIT $${values.length - 1} 
      OFFSET $${values.length}
      `,
      values
    );

    return data.rows;
  }
}
