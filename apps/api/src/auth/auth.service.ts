import { randomBytes } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "@lislestart/shared";
import { toAuthUser } from "./access";
import type { LoginDto, RegisterDto } from "./auth.dto";
import { hashPassword, verifyPassword } from "./password";
import { SessionStore } from "./session.store";
import { EmailTakenError, UsersRepository } from "./users.repository";

export interface SignedIn {
  user: AuthUser;
  sessionId: string;
}

@Injectable()
export class AuthService {
  /** Empreinte factice : un email inconnu coûte le même temps qu'un mauvais mot de passe. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionStore,
  ) {}

  async register(dto: RegisterDto): Promise<SignedIn> {
    let user;
    try {
      user = await this.users.create({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash: await hashPassword(dto.password),
        role: dto.role ?? "spectator",
      });
    } catch (error) {
      if (error instanceof EmailTakenError) {
        throw new ConflictException("Un compte existe déjà avec cet email. Connecte-toi plutôt.");
      }
      throw error;
    }
    return { user: toAuthUser(user), sessionId: await this.sessions.create(user.id) };
  }

  /** Ouvre une nouvelle session (jamais celle du cookie reçu : pas de fixation de session). */
  async login(dto: LoginDto, previousSessionId?: string): Promise<SignedIn> {
    const user = await this.users.findByEmail(dto.email);
    this.dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
    const valid = await verifyPassword(user?.passwordHash ?? (await this.dummyHash), dto.password);
    if (!user || !valid) throw new UnauthorizedException("Email ou mot de passe incorrect.");

    if (previousSessionId) await this.sessions.destroy(previousSessionId);
    return { user: toAuthUser(user), sessionId: await this.sessions.create(user.id) };
  }

  async logout(sessionId?: string): Promise<void> {
    if (sessionId) await this.sessions.destroy(sessionId);
  }
}
