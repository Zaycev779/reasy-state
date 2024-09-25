"use client";

import { useState } from "react";
import { getGlobalData } from "../get-global";
import { IStore } from "../types/store";
import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import { assign, diffValues, isAFunction, isDefaultObject } from "../utils";
import { useEvent } from "./use-event.hook";

interface IProps {
    mapKey: string;
    filterFunc?: any;
}

export const useStoreVal = ({ filterFunc, mapKey }: IProps) => {
    const [path, setPath] = useState<string[]>(EStorage.getMapByKey(mapKey));
    const getState = () => getGlobalData(path, true, filterFunc);
    const [state, setState] = useState(getState());
    useEvent<{
        params: IStore;
    }>({
        type: path ? PUSH_EV_NAME + path.join() : undefined,
        onChange({ params }) {
            const arrrIdx = path?.findIndex((val) => val === "[]") ?? -1;
            if (arrrIdx >= 0 && path) {
                if (!Array.isArray(params)) return setState(params);
                const additionalPaths = path.slice(arrrIdx + 1, path.length);
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
        onStartEvent() {
            setState(getState());
        },
    });

    useEvent<{
        path: string[];
    }>({
        type: mapKey ? PATH_MAP_EV_NAME + mapKey : undefined,
        onChange({ path }) {
            if (path) {
                setPath(path);
                setState(getState());
            }
        },
    });

    return state;
};
