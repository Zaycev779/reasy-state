import { getGlobalData } from "./global/get";
import { concat, pathToString } from "./utils";
import { IStore } from "./types/store";
import { getAdditionalPaths, getRootPaths, getUpdatedPaths } from "./utils";
import { isClient } from "./utils/client";

const ev = "_EV";
export const PUSH_EV_NAME = "__PUSH" + ev;
export const PATH_MAP_EV_NAME = "__PATH" + ev;

export const _updatePathEvent = (pathMap: string, p: string[]) =>
    sendEvent(PATH_MAP_EV_NAME + pathMap, p);

export const _pushStoreValueEvent = <T extends IStore<T>>(
    paths: string[],
    updatedParams: T,
    prevValues: T,
) => {
    const updatePaths = concat(
        getUpdatedPaths(updatedParams, prevValues, paths),
        getAdditionalPaths(paths),
    ) as string[][];
    const rest = concat(paths);

    if (updatePaths.length) {
        rest.splice(-1);
        updatePaths.push(...getRootPaths(rest));
    }
    updatePaths.forEach((pathVal) =>
        sendEvent(PUSH_EV_NAME + pathToString(pathVal), getGlobalData(pathVal)),
    );
};

const sendEvent = (route: string, p: any) =>
    isClient &&
    document.dispatchEvent(
        new CustomEvent(route, {
            detail: { p },
        }),
    );
