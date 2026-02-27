import pino from "pino";
import { env } from "../../config/env.js";

const isProd = env.NODE_ENV === "production";

const devPrettyConfig = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
};

export const loggerConfig = {
  level: env.LOG_LEVEL,
  base: null,
  serializers: {
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProd ? {} : devPrettyConfig),

  // prevent log JWT or credentials, later
  // redact: ["req.headers.authorization"]
};

export const logger = pino(loggerConfig);
