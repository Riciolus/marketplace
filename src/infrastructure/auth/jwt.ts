import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

type JwtPayload = {
  jti: string;
  sub: string; // user id
};

export class JwtService {
  generateAccessToken(sub: string) {
    return jwt.sign({ sub }, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
      issuer: "marketplace-api",
      audience: "marketplace-client",
    });
  }

  generateRefreshToken(payload: JwtPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
      issuer: "marketplace-api",
      audience: "marketplace-client",
    });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }
}
