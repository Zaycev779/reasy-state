import { useRef, useState } from "react";
import { getGlobalData } from "../global/get";
import { IStore } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import {
    createCopy,
    diffValuesBoolean,
    findPathArrayIndex,
    isAFunction,
    pathToString,
} from "../utils";
import { useEvent } from "./use-event.hook";
import { getMapByKey } from "../maps/utils";

export const useStoreVal = (mapKey: string, filterFunc?: any) => {
    const [path, setPath] = useState<string[]>(getMapByKey(mapKey));
    const getState = (newPath?: string[]) =>
        getGlobalData(newPath || path, true, filterFunc);

    const [state, setState] = useState(getState);
    const prevState = useRef<any>(state);

    const _setState = (values: any) => {
        if (diffValuesBoolean(prevState.current, values)) {
            setState(values);
            prevState.current = values;
        }
    };

    useEvent<{ p: IStore }>(
        path && PUSH_EV_NAME + pathToString(path),
        ({ p }) => {
            const sliceIdx = findPathArrayIndex(path);
            if (sliceIdx < 0 || !Array.isArray(p)) _setState(createCopy(p));
            else {
                _setState(
                    path
                        .slice(sliceIdx + 1)
                        .reduce(
                            (prev, key) => prev.map((val) => val[key]),
                            isAFunction(filterFunc) ? p.filter(filterFunc) : p,
                        ),
                );
            }
        },
        () => _setState(getState()),
    );

    useEvent<{
        p: string[];
    }>(mapKey && PATH_MAP_EV_NAME + mapKey, ({ p }) => {
        if (p) {
            setPath(p);
            _setState(getState(p));
        }
    });

    return state;
};
