import { logger } from "../shared/logger/logger.js";

logger.info("Hello Worlds");

logger.error(
  {
    err: "error msg",
    queryName: "user.getUserById",
  },
  "Database query failed"
);
