import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayInit,
} from "@nestjs/websockets";
import type {
  AuthUser,
  ClientToServerEvents,
  RealtimeAck,
  RealtimeSubscription,
  ServerToClientEvents,
} from "@lislestart/shared";
import type { Server, Socket } from "socket.io";
import { SESSION_COOKIE, toAuthUser } from "../auth/access";
import { SessionStore } from "../auth/session.store";
import { UsersRepository } from "../auth/users.repository";
import { RealtimeAccess } from "./realtime.access";

interface SocketData {
  /** Utilisateur identifié par son cookie à la connexion ; null pour un visiteur anonyme. */
  user: AuthUser | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- pas d'événements entre serveurs
export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/** Au-delà, un client abusif pourrait suivre tous les tournois et matchs à la fois. */
export const MAX_SUBSCRIPTIONS = 20;
const ID_PATTERN = /^[\w-]{1,64}$/;

/** Même message pour un tournoi inexistant ou privé : on ne révèle pas qu'il existe. */
const NOT_FOUND: RealtimeAck = { ok: false, error: "Tournoi ou match introuvable." };
const INVALID: RealtimeAck = {
  ok: false,
  error: 'Abonnement invalide : attendu { type: "tournament" | "match", id }.',
};

export const roomOf = ({ type, id }: RealtimeSubscription): string => `${type}:${id}`;

function parseSubscription(body: unknown): RealtimeSubscription | null {
  if (typeof body !== "object" || body === null) return null;
  const { type, id } = body as Record<string, unknown>;
  if (type !== "tournament" && type !== "match") return null;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) return null;
  return { type, id };
}

function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of header?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

/**
 * Point d'entrée Socket.IO. Le client s'abonne à des rooms (`tournament:<id>`, `match:<id>`) ;
 * le serveur y diffuse les changements via RealtimeService. Suivre un tournoi public ne demande
 * pas de compte ; un tournoi privé est réservé aux administrateurs en attendant les inscriptions.
 */
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit<RealtimeServer> {
  @WebSocketServer()
  server!: RealtimeServer;

  constructor(
    private readonly sessions: SessionStore,
    private readonly users: UsersRepository,
    private readonly access: RealtimeAccess,
  ) {}

  /** Identifie l'utilisateur avant la connexion : aucun message n'arrive avant cette étape. */
  afterInit(server: RealtimeServer): void {
    server.use((socket, next) => {
      this.identify(socket).then(() => next(), next);
    });
  }

  private async identify(socket: RealtimeSocket): Promise<void> {
    const sessionId = readCookie(socket.handshake.headers.cookie, SESSION_COOKIE);
    const userId = sessionId ? await this.sessions.touch(sessionId) : null;
    const user = userId ? await this.users.findById(userId) : null;
    socket.data.user = user ? toAuthUser(user) : null;
  }

  @SubscribeMessage("subscribe")
  async subscribe(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() body: unknown,
  ): Promise<RealtimeAck> {
    const subscription = parseSubscription(body);
    if (!subscription) return INVALID;

    const room = roomOf(subscription);
    if (socket.rooms.has(room)) return { ok: true };
    if (this.subscriptionCount(socket) >= MAX_SUBSCRIPTIONS) {
      return { ok: false, error: `Limite de ${MAX_SUBSCRIPTIONS} abonnements atteinte.` };
    }

    const tournament =
      subscription.type === "tournament"
        ? await this.access.tournament(subscription.id)
        : await this.access.tournamentOfMatch(subscription.id);
    if (!tournament) return NOT_FOUND;
    if (!tournament.isPublic && socket.data.user?.role !== "admin") return NOT_FOUND;

    await socket.join(room);
    return { ok: true };
  }

  @SubscribeMessage("unsubscribe")
  async unsubscribe(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() body: unknown,
  ): Promise<RealtimeAck> {
    const subscription = parseSubscription(body);
    if (!subscription) return INVALID;
    await socket.leave(roomOf(subscription));
    return { ok: true };
  }

  /** Rooms suivies, sans la room privée que Socket.IO crée pour chaque socket. */
  private subscriptionCount(socket: RealtimeSocket): number {
    return [...socket.rooms].filter((room) => room !== socket.id).length;
  }
}
