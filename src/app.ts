import Fastify from "fastify";
import { loggerConfig } from "./shared/logger/logger.js";
import { AppError } from "./shared/errors/AppError.js";
import { userRoutes } from "./modules/user/user.routes.js";
import { ZodError } from "zod";
import { buildContainer } from "./bootstrap/container.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import fastifyCookie from "@fastify/cookie";
import { productRoutes } from "./modules/products/product.routes.js";

export const app = Fastify({ logger: loggerConfig });

const container = buildContainer();

await app.register(fastifyCookie);

app.register(
  async (instance) => {
    await userRoutes(instance, container.user.controller);
  },
  { prefix: "/users" }
);

app.register(
  async (instance) => {
    await authRoutes(instance, container.auth.controller, container.auth.guard);
  },
  { prefix: "/auth" }
);

app.register(
  async (instance) => {
    await productRoutes(
      instance,
      container.product.controller,
      container.auth.guard
    );
  },
  { prefix: "/products" }
);

app.setErrorHandler(function (error, request, reply) {
  if (error instanceof AppError) {
    request.log.warn(
      {
        err: error,
      },
      "Handled application error"
    );

    return reply.status(error.statusCode).send({
      success: false,
      message: error.expose ? error.message : "Something went wrong",
      code: error.code,
    });
  }

  if (error instanceof ZodError) {
    request.log.warn(
      {
        issues: error.issues,
      },
      "Validation error"
    );

    return reply.status(400).send({
      success: false,
      code: "VALIDATION_ERROR",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  request.log.error(
    {
      err: error,
    },
    "Unhandled application error"
  );

  return reply.status(500).send({
    success: false,
    message: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
});
