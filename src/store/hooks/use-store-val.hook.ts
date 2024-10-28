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
const { useState } = React;

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    pathKey = storage.m[mapKey],
    prevState?: any,
) => {
    const [path, setPath] = useState<string[]>(pathKey),
        getState = (newPath?: string[]) =>
            getGlobalData(storage.s, newPath || path, true, filterFunc),
        [state, setState] = useState((prevState = getState())),
        _setState = (values: any = getState()) =>
            diffValuesBoolean(prevState, values) &&
            (setState(values), (prevState = values));

    useEvent<{ p: IStore }>(
        path && PUSH_EV_NAME + storage.id + pathToString(path),
        ({ p }) =>
            _setState(
                !isArrayPathName(path) || !isArray(p)
                    ? createCopy(p)
                    : slice(path, findPathArrayIndex(path)).reduce(
                          (prev, key) => prev.flatMap((val: any) => val[key]),
                          getFiltred(p, filterFunc),
                      ),
            ),
        _setState,
    );

    useEvent<{
        p: string[];
    }>(
        PATH_MAP_EV_NAME + storage.id + mapKey,
        ({ p }) => p && (setPath(p), _setState(getState(p))),
        () => diffValuesBoolean(path, pathKey) && setPath(pathKey),
    );

    return state;
};
