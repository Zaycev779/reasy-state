import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import { createCopy, diffValuesBoolean } from "../utils";
import { useEvent } from "./use-event.hook";
import React from "react";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    pathKey = storage.m[mapKey],
    get = (path: string[]) =>
        createCopy(getGlobalData(storage, path, filterFunc)),
    prevState: any = get(pathKey),
) => {
    const [[p, state], set] = React.useState<[string[], any]>([
        pathKey,
        prevState,
    ]);
    const _setState = (values: any = get(p)) =>
        diffValuesBoolean(prevState, values) &&
        (set([p, values]), (prevState = values));

    useEvent(storage.id + PUSH_EV_NAME + p, _setState);

    useEvent(
        storage.id + PATH_MAP_EV_NAME + mapKey,
        (n = storage.m[mapKey]) => set([n, get(n)]),
        () => diffValuesBoolean(p, pathKey) && set([pathKey, state]),
    );

    return state;
};
