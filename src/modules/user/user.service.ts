import { hash } from "bcrypt";
import { ConflictError, NotFoundError } from "../../shared/errors/AppError.js";
import type { UserRepository } from "./user.repository.js";
import type { CreateUserInput } from "./user.schema.js";

export class UserService {
  constructor(private repo: UserRepository) {}

  async getUsers() {
    return this.repo.findAll();
  }

  async getUserById(id: string) {
    const user = await this.repo.findById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async createUser({ email, password, name }: CreateUserInput) {
    const existing = await this.repo.findByEmail(email);

    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await hash(password, 12);

    return this.repo.create(email, passwordHash, name);
  }
}
