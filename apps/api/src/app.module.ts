import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AccessGuard } from "./auth/access";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { APP_CONFIG, loadConfig } from "./config";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.service";

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
  ],
  controllers: [HealthController],
  providers: [
    // Ordre voulu : limitation de débit, puis authentification et rôles
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
})
export class AppModule {}
