import createClient from "openapi-fetch";
import type {paths} from "./schemas/dwe_os_2";

export const API_CLIENT = createClient<paths>({ baseUrl: 'http://localhost:5000' });
