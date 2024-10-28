import { isClient } from "./utils";

export const PUSH_EV_NAME = "_PUSH";
export const PATH_MAP_EV_NAME = "_PATH";

export const sendEvent = (route: string, p: any) =>
    isClient &&
    dispatchEvent(
        new CustomEvent(route, {
            detail: { p },
        }),
    );
