import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RedisSessionStore, SessionStore } from "./session.store";
import { PrismaUsersRepository, UsersRepository } from "./users.repository";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: SessionStore, useClass: RedisSessionStore },
    { provide: UsersRepository, useClass: PrismaUsersRepository },
  ],
  // Utilisés par AccessGuard, déclaré dans AppModule après la limitation de débit
  exports: [SessionStore, UsersRepository],
})
export class AuthModule {}
