import { compare } from "bcrypt";
import { UnauthorizedError } from "../../shared/errors/AppError.js";
import type { UserRepository } from "../user/user.repository.js";
import type { UserRow } from "../user/user.types.js";

export class AuthService {
  constructor(private repo: UserRepository) {}

  async login(email: string, password: string) {
    const user = await this.repo.findWithPasswordByEmail(email);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const match = await compare(password, user.password_hash);

    if (!match) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // excude password_hash
    const { password_hash, ...safeUser } = user;

    return safeUser as UserRow;
  }
}
