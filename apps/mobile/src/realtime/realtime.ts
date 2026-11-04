import type {
  ClientToServerEvents,
  MatchUpdatedEvent,
  ServerToClientEvents,
} from "@lislestart/shared";
import { io, type Socket } from "socket.io-client";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface Realtime {
  /** Suit les matchs des tournois donnés ; renvoie la fonction qui arrête le suivi. */
  watchTournaments(ids: readonly string[], onMatch: (event: MatchUpdatedEvent) => void): () => void;
}

interface Watcher {
  ids: ReadonlySet<string>;
  onMatch: (event: MatchUpdatedEvent) => void;
}

/**
 * Client Socket.IO partagé par tous les écrans (voir docs/realtime.md). Une seule connexion,
 * ouverte au premier suivi et fermée au dernier ; les abonnements sont refaits à chaque
 * reconnexion, car le serveur les oublie quand la connexion tombe.
 */
export function createSocketRealtime(
  baseUrl: string,
  connect: (url: string) => RealtimeSocket = (url) => io(url, { transports: ["websocket"] }),
): Realtime {
  let socket: RealtimeSocket | null = null;
  const watchers = new Set<Watcher>();
  /** Nombre d'écrans qui suivent chaque tournoi. */
  const counts = new Map<string, number>();

  // Un refus (tournoi privé, supprimé) n'empêche pas l'écran de fonctionner : il reste à jour
  // par rafraîchissement. On n'attend donc pas l'accusé.
  const subscribe = (id: string) => socket?.emit("subscribe", { type: "tournament", id }, () => {});
  const unsubscribe = (id: string) =>
    socket?.emit("unsubscribe", { type: "tournament", id }, () => {});

  function open(): RealtimeSocket {
    const created = connect(baseUrl);
    created.on("connect", () => {
      for (const id of counts.keys()) subscribe(id);
    });
    created.on("match:updated", (event) => {
      for (const watcher of watchers) {
        if (watcher.ids.has(event.tournamentId)) watcher.onMatch(event);
      }
    });
    return created;
  }

  return {
    watchTournaments(ids, onMatch) {
      const watcher: Watcher = { ids: new Set(ids), onMatch };
      watchers.add(watcher);
      socket ??= open();
      for (const id of watcher.ids) {
        const count = counts.get(id) ?? 0;
        counts.set(id, count + 1);
        if (count === 0 && socket.connected) subscribe(id);
      }

      return () => {
        if (!watchers.delete(watcher)) return;
        for (const id of watcher.ids) {
          const count = (counts.get(id) ?? 1) - 1;
          if (count > 0) {
            counts.set(id, count);
          } else {
            counts.delete(id);
            if (socket?.connected) unsubscribe(id);
          }
        }
        if (watchers.size === 0) {
          socket?.disconnect();
          socket = null;
        }
      };
    },
  };
}
