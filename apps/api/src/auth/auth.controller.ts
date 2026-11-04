import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { AuthUser } from "@lislestart/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { APP_CONFIG, type AppConfig } from "../config";
import { CurrentUser, Public, SESSION_COOKIE } from "./access";
import { AuthUserDto, LoginDto, RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { SESSION_TTL_SECONDS } from "./session.store";

/** 5 tentatives par minute et par adresse IP sur l'inscription et la connexion. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags("authentification")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private setSession(reply: FastifyReply, sessionId: string): void {
    reply.setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("register")
  @ApiCreatedResponse({ type: AuthUserDto, description: "Compte créé, session ouverte." })
  @ApiConflictResponse({ description: "Email déjà utilisé." })
  @ApiTooManyRequestsResponse({ description: "Trop de tentatives." })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthUser> {
    const { user, sessionId } = await this.auth.register(dto);
    this.setSession(reply, sessionId);
    return user;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ type: AuthUserDto, description: "Session ouverte (cookie HttpOnly)." })
  @ApiUnauthorizedResponse({ description: "Email ou mot de passe incorrect." })
  @ApiTooManyRequestsResponse({ description: "Trop de tentatives." })
  async login(
    @Body() dto: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthUser> {
    const { user, sessionId } = await this.auth.login(dto, request.cookies[SESSION_COOKIE]);
    this.setSession(reply, sessionId);
    return user;
  }

  /** Publique : une session déjà expirée doit pouvoir effacer son cookie. */
  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Session fermée." })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logout(request.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  @Get("me")
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ description: "Pas de session valide." })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
