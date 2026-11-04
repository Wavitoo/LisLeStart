import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../config";
import { hashPassword } from "./password";
import { UsersRepository } from "./users.repository";

export type InitialAdminOutcome = "created" | "already-admin" | "email-taken";

/**
 * Crée le premier administrateur s'il n'existe pas. Un compte existant n'est jamais promu :
 * sinon, s'inscrire avec ADMIN_EMAIL avant le premier démarrage donnerait les droits d'admin.
 */
export async function ensureInitialAdmin(
  users: UsersRepository,
  admin: NonNullable<AppConfig["initialAdmin"]>,
): Promise<InitialAdminOutcome> {
  const existing = await users.findByEmail(admin.email);
  if (existing) return existing.role === "admin" ? "already-admin" : "email-taken";

  await users.create({
    email: admin.email,
    displayName: admin.displayName,
    passwordHash: await hashPassword(admin.password),
    role: "admin",
  });
  return "created";
}

@Injectable()
export class InitialAdmin implements OnApplicationBootstrap {
  private readonly logger = new Logger("InitialAdmin");

  constructor(
    private readonly users: UsersRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const admin = this.config.initialAdmin;
    if (!admin) return;

    const outcome = await ensureInitialAdmin(this.users, admin);
    if (outcome === "created") this.logger.log(`Administrateur créé : ${admin.email}`);
    if (outcome === "email-taken") {
      this.logger.error(
        `ADMIN_EMAIL (${admin.email}) appartient déjà à un compte non administrateur : il n'est pas promu. Choisis un autre email.`,
      );
    }
  }
}
