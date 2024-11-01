import { isClient } from "./utils";

export const PUSH_EV_NAME = "PUSH";
export const PATH_MAP_EV_NAME = "PATH";

export const sendEvent = (route: string) =>
    isClient && dispatchEvent(new CustomEvent(route));
