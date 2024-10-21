import { EStorage } from "./global";
import { getGlobalData } from "./global/get";
import { concat, pathToString } from "./utils";
import { getAdditionalPaths, getRootPaths, getUpdatedPaths } from "./utils";
import { isClient } from "./utils/client";

const ev = "_EV";
export const PUSH_EV_NAME = "_PUSH" + ev;
export const PATH_MAP_EV_NAME = "_PATH" + ev;

export const _pushStoreValueEvent = (
    storage: EStorage,
    paths: string[],
    updatedParams: any,
    prevValues: any,
) =>
    concat(
        getRootPaths(paths.slice(0, -1)),
        getUpdatedPaths(updatedParams, prevValues, paths),
        getAdditionalPaths(storage, paths),
    ).forEach((pathVal: string[]) =>
        sendEvent(
            PUSH_EV_NAME + storage.id + pathToString(pathVal),
            getGlobalData(storage.s, pathVal),
        ),
    );

export const sendEvent = (route: string, p: any) =>
    isClient &&
    document.dispatchEvent(
        new CustomEvent(route, {
            detail: { p },
        }),
    );
