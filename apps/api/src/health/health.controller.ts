import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/access";

export interface HealthStatus {
  status: "ok";
  service: "lislestart-api";
  time: string;
}

@Public()
@ApiTags("santé")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "L'API répond." })
  check(): HealthStatus {
    return { status: "ok", service: "lislestart-api", time: new Date().toISOString() };
  }
}
