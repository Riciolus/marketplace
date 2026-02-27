import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./infrastructure/database/pool.js";

const PORT = 3000;

let isShuttingDown = false;

async function shutdown(signal?: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  app.log.info({ signal }, "Shutting down application");

  try {
    await app.close();
    await pool.end();
    app.log.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}

async function startServer() {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });

    app.log.info({ port: PORT, env: env.NODE_ENV });
  } catch (err) {
    app.log.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl + C
process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker/K8s stop
process.on("uncaughtException", async (err) => {
  app.log.fatal({ err }, "Uncaught Exception");
  await shutdown("uncaughtException");
});
process.on("unhandledRejection", async (err) => {
  app.log.fatal({ err }, "Unhandled Rejection");
  await shutdown("unhandledRejection");
});

startServer();
