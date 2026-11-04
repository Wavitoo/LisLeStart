import fastifyCookie from "@fastify/cookie";
import { BadRequestException, ValidationPipe, type ValidationError } from "@nestjs/common";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

export interface FieldError {
  field: string;
  message: string;
}

/** Une erreur par champ, pour que le formulaire l'affiche à côté du bon champ. */
export function toFieldErrors(errors: ValidationError[], parent = ""): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([rule, message]) => ({
      field,
      message: rule === "whitelistValidation" ? "Champ inconnu." : message,
    }));
    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

/** Réglages communs à l'API et aux tests de bout en bout. */
export async function configureApp(app: NestFastifyApplication): Promise<void> {
  await app.register(fastifyCookie);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          statusCode: 400,
          message: "Certains champs sont invalides.",
          errors: toFieldErrors(errors),
        }),
    }),
  );
}
