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
import { useRef, useState } from "../utils/client";
import { EStorage } from "../global";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,
) => {
    const pathKey = getMapByKey(storage, mapKey);
    const [path, setPath] = useState<string[]>(pathKey);
    const getState = (newPath?: string[]) =>
        getGlobalData(storage.s, newPath || path, true, filterFunc);

    const [state, setState] = useState(getState);
    const prevState = useRef<any>(state);

    const _setState = (values: any) =>
        diffValuesBoolean(prevState.current, values) &&
        (setState(values), (prevState.current = values));

    useEvent<{ p: IStore }>(
        path && PUSH_EV_NAME + storage.id + pathToString(path),
        ({ p }) =>
            _setState(
                !isArrayPathName(path) || !isArray(p)
                    ? createCopy(p)
                    : slice(path, findPathArrayIndex(path) + 1).reduce(
                          (prev, key) => prev.flatMap((val: any) => val[key]),
                          getFiltred(p, filterFunc),
                      ),
            ),
        () => _setState(getState()),
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
