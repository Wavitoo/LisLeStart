import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, type RegisterValues } from "./schema";

function errors(schema: typeof loginSchema | typeof registerSchema, values: unknown) {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

const validRegistration: RegisterValues = {
  displayName: "renard_bleu",
  email: "renard.bleu@exemple.test",
  password: "trois mots au hasard",
  role: "spectator",
};

describe("loginSchema", () => {
  it("accepte des identifiants bien formés", () => {
    expect(errors(loginSchema, { email: " Nom@Exemple.fr ", password: "x" })).toEqual({});
  });

  it("champs vides", () => {
    expect(errors(loginSchema, { email: "", password: "" })).toEqual({
      email: "Indique ton email : par exemple nom@exemple.fr.",
      password: "Indique ton mot de passe.",
    });
  });

  it("email mal formé", () => {
    expect(errors(loginSchema, { email: "nom.exemple.fr", password: "x" }).email).toBe(
      "Cet email n'est pas valide : vérifie qu'il contient un @ et un domaine, par exemple nom@exemple.fr.",
    );
  });

  it("mot de passe trop long", () => {
    expect(errors(loginSchema, { email: "a@b.fr", password: "x".repeat(129) }).password).toBe(
      "Le mot de passe fait 128 caractères au maximum : vérifie ta saisie.",
    );
  });
});

describe("registerSchema", () => {
  it("accepte une inscription valide", () => {
    expect(errors(registerSchema, validRegistration)).toEqual({});
  });

  it("champs vides : un message par champ, avec la marche à suivre", () => {
    expect(
      errors(registerSchema, { ...validRegistration, displayName: " ", email: "", password: "" }),
    ).toEqual({
      displayName:
        "Choisis un pseudo : il apparaîtra dans les classements, par exemple renard_bleu.",
      email: "Indique ton email : par exemple nom@exemple.fr.",
      password:
        "Choisis un mot de passe d'au moins 10 caractères. Une phrase de passe marche bien.",
    });
  });

  it("pseudo trop court ou trop long", () => {
    expect(errors(registerSchema, { ...validRegistration, displayName: "a" }).displayName).toBe(
      "Le pseudo est trop court (1 caractère) : utilise au moins 2 caractères.",
    );
    expect(
      errors(registerSchema, { ...validRegistration, displayName: "x".repeat(33) }).displayName,
    ).toBe("Le pseudo dépasse 32 caractères (33) : raccourcis-le.");
  });

  it("email trop long", () => {
    const email = `${"x".repeat(250)}@b.fr`;
    expect(errors(registerSchema, { ...validRegistration, email }).email).toBe(
      "L'email dépasse 254 caractères : utilise une adresse plus courte.",
    );
  });

  it("mot de passe trop court ou trop long", () => {
    expect(errors(registerSchema, { ...validRegistration, password: "court" }).password).toBe(
      "Le mot de passe est trop court (5 caractères) : utilise au moins 10 caractères, par exemple trois mots au hasard.",
    );
    expect(
      errors(registerSchema, { ...validRegistration, password: "x".repeat(129) }).password,
    ).toBe("Le mot de passe dépasse 128 caractères (129) : raccourcis-le.");
  });

  it("un administrateur ne peut pas s'inscrire lui-même", () => {
    expect(registerSchema.safeParse({ ...validRegistration, role: "admin" }).success).toBe(false);
  });
});
