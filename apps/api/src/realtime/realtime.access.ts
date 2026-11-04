import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface TournamentVisibility {
  isPublic: boolean;
}

/** Visibilité des tournois pour les abonnements temps réel ; remplacé par un faux dans les tests. */
export abstract class RealtimeAccess {
  abstract tournament(id: string): Promise<TournamentVisibility | null>;
  /** Visibilité du tournoi auquel appartient le match. */
  abstract tournamentOfMatch(matchId: string): Promise<TournamentVisibility | null>;
}

@Injectable()
export class PrismaRealtimeAccess extends RealtimeAccess {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async tournament(id: string): Promise<TournamentVisibility | null> {
    return this.prisma.tournament.findUnique({ where: { id }, select: { isPublic: true } });
  }

  async tournamentOfMatch(matchId: string): Promise<TournamentVisibility | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { stage: { select: { tournament: { select: { isPublic: true } } } } },
    });
    return match?.stage.tournament ?? null;
  }
}
