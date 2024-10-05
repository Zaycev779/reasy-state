"use client";

import { useEffect, useRef, useState } from "react";
import { getGlobalData } from "../get-global";
import { IStore } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import {
    assign,
    diffValues,
    findPathArrayIndex,
    isAFunction,
    isDefaultObject,
    pathToString,
} from "../utils";
import { useEvent } from "./use-event.hook";
import { getMapByKey } from "../maps/utils";

interface IProps {
    mapKey: string;
    filterFunc?: any;
}

export const useStoreVal = ({ filterFunc, mapKey }: IProps) => {
    const [path, setPath] = useState<string[]>(getMapByKey(mapKey));
    const getState = () => getGlobalData(path, true, filterFunc);
    const isInit = useRef<boolean>();
    const [state, setState] = useState(getState);

    useEffect(() => {
        if (isInit.current) {
            setPath(getMapByKey(mapKey));
        }
        isInit.current = true;
    }, [mapKey]);

    useEvent<{
        params: IStore;
    }>({
        type: path ? PUSH_EV_NAME + pathToString(path) : undefined,
        onChange: ({ params }) => {
            const sliceIdx = findPathArrayIndex(path);
            if (sliceIdx >= 0) {
                if (!Array.isArray(params)) return setState(params);
                const additionalPaths = path.slice(sliceIdx + 1, path.length);
                const filteredValue = isAFunction(filterFunc)
                    ? params.filter(filterFunc)
                    : params;
                const vals = additionalPaths.reduce(
                    (prev, key) => prev.map((val) => val[key]),
                    filteredValue,
                );

                setState((prev) => diffValues(prev, vals));
                return;
            }
            setState(isDefaultObject(params) ? assign({}, params) : params);
        },
        onChangeType: () => setState(getState()),
    });

    useEvent<{
        path: string[];
    }>({
        type: mapKey ? PATH_MAP_EV_NAME + mapKey : undefined,
        onChange: ({ path }) => {
            if (path) {
                setPath(path);
                setState(getState());
            }
        },
    });

    return state;
};
