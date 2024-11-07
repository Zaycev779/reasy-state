/* eslint-disable no-restricted-globals */
import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import { concat, createCopy, isPathNameType, stringify } from "../utils";
import React from "react";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    onLoad: () => void,
    filterFunc?: any,
    get = () =>
        createCopy(getGlobalData(storage, storage.m[mapKey], filterFunc)),
    prevState: any = get(),
    c = storage.c,
) => {
    let [state, set] = React.useState<[string[], any]>(prevState),
        fn = () => (
            (state = get()),
            stringify(prevState) !== stringify(state) &&
                set((prevState = state))
        );

    React.useEffect(
        () => (
            ((c[mapKey] = concat(c[mapKey] || [], fn)), onLoad()),
            () => c[mapKey].splice(isPathNameType(c[mapKey], fn) - 1, 1) as any
        ),
        [mapKey],
    );

    return state;
};
