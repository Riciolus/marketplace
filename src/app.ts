import Fastify from "fastify";
import { loggerConfig } from "./shared/logger/logger.js";
import { AppError } from "./shared/errors/AppError.js";

export const app = Fastify({ logger: loggerConfig });

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
