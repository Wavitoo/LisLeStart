import { createHttpApi, type Api } from "./client";
import { createMockApi } from "./mock";

export { ApiError, type Api } from "./client";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

/** Vrai tant qu'aucune URL d'API n'est configurée : l'app affiche des données simulées. */
export const usingMockData = !baseUrl;

/** API réelle si EXPO_PUBLIC_API_URL est défini, sinon données simulées. */
export const api: Api = baseUrl ? createHttpApi(baseUrl) : createMockApi();
