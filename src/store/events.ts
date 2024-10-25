import { isClient } from "./utils";

export const PUSH_EV_NAME = "_PUSH_EV";
export const PATH_MAP_EV_NAME = "_PATH_EV";

export const sendEvent = (route: string, p: any) =>
    isClient &&
    document.dispatchEvent(
        new CustomEvent(route, {
            detail: { p },
        }),
    );
