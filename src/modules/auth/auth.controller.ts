import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "./auth.service.js";
import { loginSchema, refreshSchema } from "./auth.schema.js";
import { env } from "../../config/env.js";

export class AuthController {
  constructor(private service: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(request.body);

    const token = await this.service.login(email, password);

    reply
      .setCookie("refreshToken", token.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({ success: true, data: { accessToken: token.accessToken } });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = refreshSchema.parse(request.cookies);

    const result = await this.service.refresh(refreshToken);

    reply
      .setCookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
  }
}
