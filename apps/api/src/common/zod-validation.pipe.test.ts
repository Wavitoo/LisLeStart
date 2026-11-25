import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

const pipe = new ZodValidationPipe(
  z.strictObject(
    { name: z.string().trim().min(1, { error: "Nom obligatoire." }), tags: z.array(z.string()) },
    { error: "Champ inconnu." },
  ),
);

const errorsOf = (value: unknown) => {
  try {
    pipe.transform(value);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).getResponse();
  }
  throw new Error("aucune erreur levée");
};

describe("ZodValidationPipe", () => {
  it("renvoie la valeur normalisée", () => {
    expect(pipe.transform({ name: " Go ", tags: [] })).toEqual({ name: "Go", tags: [] });
  });

  it("lève un 400 au format du pipe global, une erreur par champ", () => {
    expect(errorsOf({ name: " ", tags: [1], extra: true })).toEqual({
      statusCode: 400,
      message: "Certains champs sont invalides.",
      errors: [
        { field: "name", message: "Nom obligatoire." },
        { field: "tags.0", message: expect.any(String) },
        { field: "extra", message: "Champ inconnu." },
      ],
    });
  });
});
