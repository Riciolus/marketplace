// src/container.ts

import { JwtService } from "../infrastructure/auth/jwt.js";
import { PoolExecutor } from "../infrastructure/database/executor.js";
import { RedisSessionStore } from "../infrastructure/redis/redis-session.store.js";
import { redis } from "../infrastructure/redis/redis.client.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { CategoryRepository } from "../modules/products/categories/category.repository.js";
import { ImageRepository } from "../modules/products/images/image.repository.js";
import { ProductController } from "../modules/products/product.controller.js";
import { ProductRepository } from "../modules/products/product.repository.js";
import { ProductService } from "../modules/products/product.service.js";
import { VariantRepository } from "../modules/products/variants/variant.repository.js";
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
  const variantRepository = new VariantRepository(executor);
  const categoryRepository = new CategoryRepository(executor);
  const imageRepository = new ImageRepository(executor);
  const productService = new ProductService(
    productRepository,
    variantRepository,
    categoryRepository,
    imageRepository
  );
  const productController = new ProductController(productService);

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
  };
}
