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
import { getMapByKey } from "../maps/utils";
import { EStorage } from "../global";
import React from "react";
const { useState } = React;

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    pathKey = getMapByKey(storage, mapKey),
) => {
    const [path, setPath] = useState<string[]>(pathKey),
        getState = (newPath?: string[]) =>
            getGlobalData(storage.s, newPath || path, true, filterFunc),
        [state, setState] = useState(getState),
        prevState = React.useRef<any>(state),
        _setState = (values: any = getState()) =>
            diffValuesBoolean(prevState.current, values) &&
            (setState(values), (prevState.current = values));

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
        mapKey && PATH_MAP_EV_NAME + mapKey,
        ({ p }) => p && (setPath(p), _setState(getState(p))),
        () => diffValuesBoolean(path, pathKey) && setPath(pathKey),
    );

    return state;
};
