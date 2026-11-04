import { Injectable } from "@nestjs/common";
import type { AuthUser, Role } from "@lislestart/shared";
import { Prisma, type Role as DbRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface NewUser {
  email: string;
  displayName: string;
  passwordHash: string;
  role: Role;
}

/** Levée quand l'email est déjà pris. */
export class EmailTakenError extends Error {}

/** Accès aux comptes ; remplacé par un faux en mémoire dans les tests. */
export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<StoredUser | null>;
  abstract findById(id: string): Promise<StoredUser | null>;
  /** @throws EmailTakenError */
  abstract create(user: NewUser): Promise<StoredUser>;
}

const toRole = (role: DbRole): Role => role.toLowerCase() as Role;
const toDbRole = (role: Role): DbRole => role.toUpperCase() as DbRole;

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private static readonly select = {
    id: true,
    email: true,
    displayName: true,
    passwordHash: true,
    role: true,
  } as const;

  async findByEmail(email: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: PrismaUsersRepository.select,
    });
    return user && { ...user, role: toRole(user.role) };
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PrismaUsersRepository.select,
    });
    return user && { ...user, role: toRole(user.role) };
  }

  async create(data: NewUser): Promise<StoredUser> {
    try {
      const user = await this.prisma.user.create({
        data: { ...data, role: toDbRole(data.role) },
        select: PrismaUsersRepository.select,
      });
      return { ...user, role: toRole(user.role) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new EmailTakenError();
      }
      throw error;
    }
  }
}
