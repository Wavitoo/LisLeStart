import { Injectable } from "@nestjs/common";
import type { MatchUpdatedEvent, StandingsUpdatedEvent } from "@lislestart/shared";
import { RealtimeGateway, roomOf } from "./realtime.gateway";

/**
 * Diffusion des changements aux clients abonnés. À appeler après l'enregistrement en base
 * (saisie de résultat, correction, litige, synchro start.gg, recalcul des points). Avec
 * l'adaptateur Redis, l'événement atteint aussi les clients connectés aux autres instances.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /** Vers les abonnés du tournoi et ceux du match ; un client abonné aux deux le reçoit une fois. */
  matchUpdated(event: MatchUpdatedEvent): void {
    this.gateway.server
      .to([
        roomOf({ type: "tournament", id: event.tournamentId }),
        roomOf({ type: "match", id: event.matchId }),
      ])
      .emit("match:updated", event);
  }

  standingsUpdated(event: StandingsUpdatedEvent): void {
    this.gateway.server
      .to(roomOf({ type: "tournament", id: event.tournamentId }))
      .emit("standings:updated", event);
  }
}
