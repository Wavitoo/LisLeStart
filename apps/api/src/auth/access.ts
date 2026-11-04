import {
  createParamDecorator,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthUser, Role } from "@lislestart/shared";
import type { FastifyRequest } from "fastify";
import { SessionStore } from "./session.store";
import { UsersRepository } from "./users.repository";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export const SESSION_COOKIE = "sid";

const IS_PUBLIC = "auth:public";
const ROLES = "auth:roles";

/** Route accessible sans être connecté. Par défaut, toute route exige une session. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Route réservée à certains rôles (vérifié côté serveur, après l'authentification). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Utilisateur connecté, garanti par AccessGuard sur une route non publique. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<FastifyRequest>().user;
  if (!user) throw new UnauthorizedException("Connecte-toi pour continuer.");
  return user;
});

export function toAuthUser({ id, email, displayName, role }: AuthUser): AuthUser {
  return { id, email, displayName, role };
}

/** Garde globale : authentifie par cookie de session, puis vérifie le rôle demandé. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionStore,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Socket.IO : l'utilisateur est identifié à la connexion par RealtimeGateway
    if (context.getType() !== "http") return true;

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const sessionId = request.cookies[SESSION_COOKIE];
    const userId = sessionId ? await this.sessions.touch(sessionId) : null;
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) throw new UnauthorizedException("Connecte-toi pour continuer.");
    request.user = toAuthUser(user);

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException("Tu n'as pas les droits pour cette action.");
    }
    return true;
  }
}

/**
 * Contrôle de propriété (anti-IDOR) : seul le propriétaire d'une ressource ou un administrateur
 * peut y accéder. À appeler dans chaque service qui charge une ressource par son identifiant.
 */
export function assertOwnerOrAdmin(user: AuthUser, ownerId: string): void {
  if (user.role !== "admin" && user.id !== ownerId) {
    throw new ForbiddenException("Tu n'as pas les droits sur cette ressource.");
  }
}
