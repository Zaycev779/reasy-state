import { getGlobalData } from "../global/get";
import { IStore } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import {
    createCopy,
    diffValuesBoolean,
    findPathArrayIndex,
    getFiltred,
    isArray,
    pathToString,
} from "../utils";
import { useEvent } from "./use-event.hook";
import { getMapByKey } from "../maps/utils";
import { useRef, useState } from "../utils/client";

export const useStoreVal = (mapKey: string, filterFunc?: any) => {
    const pathKey = getMapByKey(mapKey);
    const [path, setPath] = useState<string[]>(pathKey);
    const getState = (newPath?: string[]) =>
        getGlobalData(newPath || path, true, filterFunc);

    const [state, setState] = useState(getState);
    const prevState = useRef<any>(state);

    const _setState = (values: any) =>
        diffValuesBoolean(prevState.current, values) &&
        (setState(values), (prevState.current = values));

    useEvent<{ p: IStore }>(
        path && PUSH_EV_NAME + pathToString(path),
        ({ p }) => {
            const sliceIdx = findPathArrayIndex(path);
            if (sliceIdx < 0 || !isArray(p)) _setState(createCopy(p));
            else {
                _setState(
                    path
                        .slice(sliceIdx + 1)
                        .reduce(
                            (prev, key) => prev.flatMap((val: any) => val[key]),
                            getFiltred(p, filterFunc),
                        ),
                );
            }
        },
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
