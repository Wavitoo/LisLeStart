import { Global, Injectable, Module, type ExecutionContext } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AccessGuard } from "./auth/access";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { APP_CONFIG, loadConfig } from "./config";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.service";
import { RealtimeModule } from "./realtime/realtime.module";

/** Les gardes globales s'appliquent aussi à Socket.IO, où il n'y a ni IP ni en-têtes HTTP. */
@Injectable()
class HttpThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return context.getType() !== "http";
  }
}

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
class ConfigModule {}

@Module({
  imports: [
    ConfigModule,
    // Limite générale par IP ; les routes sensibles (connexion, inscription) ont la leur
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    AuditModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ordre voulu : limitation de débit, puis authentification et rôles
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
})
export class AppModule {}
