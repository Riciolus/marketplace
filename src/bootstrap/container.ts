// src/container.ts

import { JwtService } from "../infrastructure/auth/jwt.js";
import { PoolExecutor } from "../infrastructure/database/executor.js";
import { RedisSessionStore } from "../infrastructure/redis/redis-session.store.js";
import { redis } from "../infrastructure/redis/redis.client.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { UserController } from "../modules/user/user.controller.js";
import { UserRepository } from "../modules/user/user.repository.js";
import { UserService } from "../modules/user/user.service.js";

export function buildContainer() {
  const executor = new PoolExecutor();

  const userRepository = new UserRepository(executor);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);
  const jwtService = new JwtService();
  const sessionStore = new RedisSessionStore(redis);

  const authService = new AuthService(userRepository, jwtService, sessionStore);
  const authController = new AuthController(authService);
  return {
    userController,
    authController,
  };
}
