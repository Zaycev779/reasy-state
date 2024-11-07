/* eslint-disable no-restricted-globals */
import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import { createCopy, stringify } from "../utils";
import React from "react";

export const useStoreVal = (
    storage: EStorage,
    mapKey: string,
    filterFunc?: any,

    get = () =>
        createCopy(getGlobalData(storage, storage.m[mapKey], filterFunc)),
    prevState: any = get(),
    type = storage.id + mapKey,
) => {
    const [state, set] = React.useState<[string[], any]>(prevState);
    const onTargetEvent = (_: any, values: any = get()) =>
        stringify(prevState) !== stringify(values) && set((prevState = values));

    React.useEffect(
        () => (
            addEventListener(type, onTargetEvent),
            () => removeEventListener(type, onTargetEvent)
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type],
    );

    return state;
};
