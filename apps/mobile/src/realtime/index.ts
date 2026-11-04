import { mockApi } from "../api";
import { createMockRealtime, mockScenario } from "./mock";
import { createSocketRealtime, type Realtime } from "./realtime";

export type { Realtime } from "./realtime";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

/** Socket.IO de l'API si EXPO_PUBLIC_API_URL est défini, sinon direct simulé. */
export const realtime: Realtime = baseUrl
  ? createSocketRealtime(baseUrl)
  : createMockRealtime(mockScenario(mockApi?.locksAt("mock-demi-2") ?? new Date()), (event) =>
      mockApi?.applyMatchUpdate(event),
    );
