import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaRealtimeAccess, RealtimeAccess } from "./realtime.access";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";

/** Global : tout service qui change un match ou un classement le diffuse via RealtimeService. */
@Global()
@Module({
  imports: [AuthModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    { provide: RealtimeAccess, useClass: PrismaRealtimeAccess },
  ],
  exports: [RealtimeService],
})
export class RealtimeModule {}
