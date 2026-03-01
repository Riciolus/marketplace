import type { PoolExecutor } from "../../infrastructure/database/executor.js";
import type { AuthUserRow, UserRow } from "./user.types.js";

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

  async findById(id: string) {
    const result = await this.executor.query<UserRow>(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [id],
      "user.findById"
    );

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.executor.query<UserRow>(
      "SELECT id, email, role, created_at FROM users WHERE email = $1",
      [email],
      "user.findByEmail"
    );

    return result.rows[0] ?? null;
  }

  async findWithPasswordByEmail(email: string) {
    const result = await this.executor.query<AuthUserRow>(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email],
      "user.findByPasswordByEmail"
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
