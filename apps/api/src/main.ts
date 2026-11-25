import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp, createOpenApiDocument } from "./app.setup";
import { APP_CONFIG, type AppConfig } from "./config";
import { RedisIoAdapter } from "./realtime/realtime.adapter";

async function bootstrap(): Promise<void> {
  // Derrière le proxy de l'hébergeur, l'IP du client (limitation de débit) vient de X-Forwarded-For
  const adapter = new FastifyAdapter({ trustProxy: process.env.TRUST_PROXY === "true" });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  app.enableCors({ origin: corsOrigin, credentials: true });
  await configureApp(app);

  const realtime = new RedisIoAdapter(app, corsOrigin);
  await realtime.connectToRedis(app.get<AppConfig>(APP_CONFIG).redisUrl);
  app.useWebSocketAdapter(realtime);

  SwaggerModule.setup("docs", app, createOpenApiDocument(app));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.info(`API prête sur http://localhost:${port} (docs : /docs)`);
}

void bootstrap();
