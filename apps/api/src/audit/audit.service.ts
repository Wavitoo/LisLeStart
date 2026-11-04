import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Actions sensibles journalisées (cahier des charges : scores, litiges, Pick'em). */
export const AUDIT_ACTIONS = [
  "score.corrected",
  "dispute.decided",
  "pickem.created",
  "pickem.resolved",
  "pickem.cancelled",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntryInput {
  actorId: string;
  action: AuditAction;
  /** Ressource visée, sous la forme « type:id » (ex. « match:clx… »). */
  target: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

export interface AuditEntry {
  id: string;
  /** Null pour une action automatique (résolution de Pick'em, synchro start.gg). */
  actorId: string | null;
  action: string;
  target: string;
  before: Prisma.JsonValue;
  after: Prisma.JsonValue;
  createdAt: Date;
}

export interface AuditQuery {
  target?: string;
  action?: AuditAction;
  /** Identifiant de la dernière entrée de la page précédente. */
  cursor?: string;
  limit: number;
}

/**
 * Journal en ajout seul : ce service n'expose ni modification ni suppression.
 * Passer `db` (le client d'une transaction) pour écrire l'entrée avec l'action qu'elle décrit :
 * pas d'action sans trace, pas de trace sans action.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    entry: AuditEntryInput,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<AuditEntry> {
    return db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        target: entry.target,
        before: entry.before ?? Prisma.DbNull,
        after: entry.after ?? Prisma.DbNull,
      },
    });
  }

  /** Entrées les plus récentes d'abord, paginées par curseur. */
  async list({ target, action, cursor, limit }: AuditQuery): Promise<AuditEntry[]> {
    return this.prisma.auditLog.findMany({
      where: { target, action },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }
}
