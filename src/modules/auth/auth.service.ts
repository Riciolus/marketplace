import { compare } from "bcrypt";
import { UnauthorizedError } from "../../shared/errors/AppError.js";
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

    const accessToken = this.jwtService.generateAccessToken(user.id);
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
    const tokenRedis = await this.sessionStore.get(sub, jti);

    if (!tokenRedis) {
      throw new UnauthorizedError("Session expired");
    }

    if (tokenHashed !== tokenRedis) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    await this.sessionStore.delete(sub, jti);

    const sessionId = randomUUID();
    const payload = {
      sub,
      jti: sessionId,
    };

    const newAccessToken = this.jwtService.generateAccessToken(sub);
    const newToken = this.jwtService.generateRefreshToken(payload);
    const hashed = hashToken(newToken);

    await this.sessionStore.save(sub, sessionId, hashed, 7 * 24 * 60 * 60); // 7 days

    return {
      accessToken: newAccessToken,
      refreshToken: newToken,
    };
  }
}
