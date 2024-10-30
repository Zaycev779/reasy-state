import { getGlobalData } from "../global/get";
import { IStore } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import {
    createCopy,
    diffValuesBoolean,
    findPathArrayIndex,
    getFiltred,
    isArray,
    isArrayPathName,
    pathToString,
    slice,
} from "../utils";
import { useEvent } from "./use-event.hook";
import { EStorage } from "../global";
import React from "react";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    pathKey = storage.m[mapKey],
    get = (path: string[]) => getGlobalData(storage.s, path, true, filterFunc),
    prevState: any = get(pathKey),
) => {
    const [[p, s], set] = React.useState<[string[], any]>([pathKey, prevState]);
    const _setState = (values: any = get(p)) =>
        diffValuesBoolean(prevState, values) &&
        (set([p, values]), (prevState = values));

    useEvent<IStore>(
        p && PUSH_EV_NAME + storage.id + pathToString(p),
        (val) =>
            _setState(
                isArrayPathName(p) && isArray(val)
                    ? slice(p, findPathArrayIndex(p)).reduce(
                          (prev, key) => prev.flatMap((val: any) => val[key]),
                          getFiltred(val, filterFunc),
                      )
                    : createCopy(val),
            ),
        _setState,
    );

    useEvent<string[]>(
        PATH_MAP_EV_NAME + storage.id + mapKey,
        (val) => val && set([val, get(val)]),
        () => diffValuesBoolean(p, pathKey) && set([pathKey, s]),
    );

    return s;
};
