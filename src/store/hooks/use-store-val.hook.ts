/* eslint-disable no-restricted-globals */
import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import { concat, createCopy, stringify } from "../utils";
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
        ) => (
            (storage.c[mapKey] = concat(storage.c[mapKey] || [], fn)),
            () =>
                (storage.c[mapKey] = storage.c[mapKey].filter(
                    (f) => f !== fn,
                )) as any
        ),
        [mapKey],
    );

    return state;
};
