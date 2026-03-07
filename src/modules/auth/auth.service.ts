import { compare } from "bcrypt";
import { NotFoundError, UnauthorizedError } from "../../shared/errors/AppError.js";
import type { UserRepository } from "../user/user.repository.js";
import type { JwtService } from "../../infrastructure/auth/jwt.js";
import { randomUUID } from "crypto";
import type { SessionStore } from "../../infrastructure/redis/redis-session.store.js";
import { hashToken } from "../../infrastructure/auth/token-hasher.js";
import { logger } from "../../shared/logger/logger.js";

export class AuthService {
  constructor(
    private repo: UserRepository,
    private jwtService: JwtService,
    private sessionStore: SessionStore
  ) {}

  async login(email: string, password: string) {
    const user = await this.repo.findWithPasswordByEmail(email);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const match = await compare(password, user.password_hash);

    if (!match) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const sessionId = randomUUID();
    const payload = {
      sub: user.id,
      jti: sessionId,
    };

    logger.info(user, sessionId);

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);
    const hashed = hashToken(refreshToken);

    await this.sessionStore.save(user.id, sessionId, hashed, 7 * 24 * 60 * 60); // 7 days

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const { jti, sub } = this.jwtService.verifyRefreshToken(token);

    if (!jti || !sub) {
      throw new UnauthorizedError("Unverified token");
    }

    const tokenHashed = hashToken(token);
    const tokenRedis = await this.sessionStore.getDel(sub, jti);

    if (!tokenRedis) {
      await this.sessionStore.deleteAll(sub);
      throw new UnauthorizedError("Refresh token reuse detected");
    }

    if (tokenHashed !== tokenRedis) {
      await this.sessionStore.deleteAll(sub);
      throw new UnauthorizedError("Invalid refresh token");
    }

    const sessionId = randomUUID();
    const payload = {
      sub,
      jti: sessionId,
    };

    const newAccessToken = this.jwtService.generateAccessToken(payload);
    const newToken = this.jwtService.generateRefreshToken(payload);
    const hashed = hashToken(newToken);

    await this.sessionStore.save(sub, sessionId, hashed, 7 * 24 * 60 * 60); // 7 days

    return {
      accessToken: newAccessToken,
      refreshToken: newToken,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionStore.delete(userId, sessionId);
  }

  async getMe(userId: string) {
    const user = await this.repo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
