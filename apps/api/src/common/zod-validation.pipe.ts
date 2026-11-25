import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { z } from "zod";
import type { FieldError } from "../app.setup";

/** Une erreur par champ, au même format que le ValidationPipe global (voir app.setup.ts). */
export function toZodFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.flatMap((issue) => {
    const path = issue.path.map(String);
    // Champs inconnus : une erreur par champ, rattachée au champ lui-même
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({ field: [...path, key].join("."), message: issue.message }));
    }
    return [{ field: path.join("."), message: issue.message }];
  });
}

/**
 * Valide et normalise un paramètre avec un schéma zod : `@Body(new ZodValidationPipe(schema))`.
 * Typer le paramètre avec `z.infer` (et non une classe) pour que le pipe global l'ignore.
 */
@Injectable()
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      statusCode: 400,
      message: "Certains champs sont invalides.",
      errors: toZodFieldErrors(result.error),
    });
  }
}
