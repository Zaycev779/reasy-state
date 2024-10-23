import { EStorage } from "./global";
import { getGlobalData } from "./global/get";
import { concat, pathToString } from "./utils";
import { getAdditional, getRootPaths, getUpdatedPaths } from "./utils";
import { doc, isClient } from "./utils/client";

export const PUSH_EV_NAME = "_PUSH_EV";
export const PATH_MAP_EV_NAME = "_PATH_EV";

export const _pushStoreValueEvent = (
    storage: EStorage,
    paths: string[],
    updatedParams: any,
    prevValues: any,
) =>
    concat(
        getRootPaths(paths.slice(0, -1)),
        getUpdatedPaths(updatedParams, prevValues, paths),
        getAdditional(storage, paths),
    ).every((pathVal: string[]) =>
        sendEvent(
            PUSH_EV_NAME + storage.id + pathToString(pathVal),
            getGlobalData(storage.s, pathVal),
        ),
    );

export const sendEvent = (route: string, p: any) =>
    isClient &&
    doc.dispatchEvent(
        new CustomEvent(route, {
            detail: { p },
        }),
    );
