/* eslint-disable no-restricted-globals */
import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import { concat, createCopy, isPathNameType, stringify } from "../utils";
import React from "react";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    get = () =>
        createCopy(getGlobalData(storage, storage.m[mapKey], filterFunc)),
    prevState: any = get(),
) => {
    let [state, set] = React.useState<[string[], any]>(prevState);

    React.useEffect(
        (
            fn = () => (
                (state = get()),
                stringify(prevState) !== stringify(state) &&
                    set((prevState = state))
            ),
            c = storage.c,
        ) => (
            (c[mapKey] = concat(c[mapKey] || [], fn)),
            () => c[mapKey].splice(isPathNameType(c[mapKey], fn) - 1, 1) as any
        ),
        [mapKey],
    );

    return state;
};
