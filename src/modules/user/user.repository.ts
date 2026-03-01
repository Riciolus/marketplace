import type { PoolExecutor } from "../../infrastructure/database/executor.js";
import type { UserRow } from "./user.types.js";

export class UserRepository {
  constructor(private executor: PoolExecutor) {}

  async findAll() {
    const result = await this.executor.query<UserRow>(
      "SELECT id, email, role, created_at FROM users",
      [],
      "user.findAll"
    );

    return result.rows;
  }

  async findByEmail(email: string) {
    const result = await this.executor.query<UserRow>(
      "SELECT id, email, role, created_at FROM users WHERE email = $1",
      [email],
      "user.findByEmail"
    );

    return result.rows[0] ?? null;
  }

  async create(email: string, passwordHash: string) {
    const result = await this.executor.query<UserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role, created_at
      `,
      [email, passwordHash],
      "user.create"
    );

    return result.rows[0];
  }
}
