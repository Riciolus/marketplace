// Import the framework and instantiate it

import { app } from "./app.js";
import { NotFoundError, UnauthorizedError } from "./shared/errors/AppError.js";

// Declare a route
app.get("/", async function handler(request, reply) {
  reply.send({ hello: "worlds" });
  // return { hello: "world" };
});

app.get("/health", async () => {
  throw new NotFoundError("User not found");
});

// Run the server!
try {
  await app.listen({ port: 3000 });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
