// src/container.ts

import { JwtService } from "../infrastructure/auth/jwt.js";
import { PoolExecutor } from "../infrastructure/database/executor.js";
import { RedisSessionStore } from "../infrastructure/redis/redis-session.store.js";
import { redis } from "../infrastructure/redis/redis.client.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { OrderController } from "../modules/order/order.controller.js";
import { OrderRepository } from "../modules/order/order.repository.js";
import { OrderService } from "../modules/order/order.service.js";
import { ProductController } from "../modules/product/product.controller.js";
import { ProductRepository } from "../modules/product/product.repository.js";
import { ProductService } from "../modules/product/product.service.js";
import { UserController } from "../modules/user/user.controller.js";
import { UserRepository } from "../modules/user/user.repository.js";
import { UserService } from "../modules/user/user.service.js";
import { createAuthGuard } from "../shared/middleware/auth-guard.js";

export function buildContainer() {
  const jwtService = new JwtService();
  const sessionStore = new RedisSessionStore(redis);

  const executor = new PoolExecutor();
  const authGuard = createAuthGuard(jwtService, sessionStore);

  const userRepository = new UserRepository(executor);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  const authService = new AuthService(userRepository, jwtService, sessionStore);
  const authController = new AuthController(authService);

  const productRepository = new ProductRepository(executor);
  const productService = new ProductService(productRepository);
  const productController = new ProductController(productService);

  const orderRepository = new OrderRepository(executor);
  const orderService = new OrderService(orderRepository);
  const orderController = new OrderController(orderService);

  return {
    user: {
      controller: userController,
    },
    auth: {
      controller: authController,
      guard: authGuard,
    },
    product: {
      controller: productController,
      guard: authGuard,
    },
    order: {
      controller: orderController,
      guard: authGuard,
    },
  };
}
