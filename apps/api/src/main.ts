import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.enableCors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true });

  const config = new DocumentBuilder()
    .setTitle("LisLeStart API")
    .setDescription("Tournois, pronostics et Pick'em")
    .setVersion("0.1.0")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.info(`API prête sur http://localhost:${port} (docs : /docs)`);
}

void bootstrap();
