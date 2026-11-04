import { createHttpApi, type Api } from "./client";
import { createMockApi } from "./mock";

export { ApiError, type Api, type Credentials, type FieldError, type Registration } from "./client";
export { DEMO_ACCOUNT } from "./mock";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

/** Vrai tant qu'aucune URL d'API n'est configurée : l'app affiche des données simulées. */
export const usingMockData = !baseUrl;

/** Faux serveur, partagé avec le direct simulé (src/realtime) ; null avec la vraie API. */
export const mockApi = baseUrl ? null : createMockApi();

/** API réelle si EXPO_PUBLIC_API_URL est défini, sinon données simulées. */
export const api: Api = mockApi ?? createHttpApi(baseUrl as string);
