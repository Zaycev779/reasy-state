import { _pushStoreValueEvent, PATH_MAP_EV_NAME, sendEvent } from "../events";
import { getGlobalData } from "./get";
import { patchToGlobalMap } from "../maps/maps";
import { getMapByKey } from "../maps/utils";
import { storageAction } from "../storage";
import { Options, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    diffValuesBoolean,
    getAdditional,
    getParams,
    isOptionalPathName,
    mergeDeep,
} from "../utils";
import { EStorage } from ".";

export const updateGlobalData = (
    src: Record<string, any>,
    [path, ...rest]: string[],
    data?: any,
) => {
    if (!rest.length) {
        src[path] = createCopy(data);
        return;
    }
    if (!src[path]) src[path] = {};

    updateGlobalData(src[path], rest, data);
};

export const updateStore = <T>(
    storage: EStorage,
    path: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    options?: Options<T>,
    type: UpdateType = UpdateType.S,
    prevValues = getGlobalData(storage.s, path),
    updatedParams = getParams(params, prevValues),
) => {
    if (path) {
        updateGlobalData(
            storage,
            concat(["s"], path),
            type === UpdateType.P
                ? mergeDeep(undefined, {}, prevValues, updatedParams)
                : updatedParams,
        );

        (
            getAdditional(storage, path, isOptionalPathName, 0) as string[]
        ).forEach((mapKey) => {
            const prevPath = getMapByKey(storage, mapKey);
            patchToGlobalMap(storage, mapKey);
            diffValuesBoolean(prevPath, getMapByKey(storage, mapKey)) &&
                sendEvent(
                    PATH_MAP_EV_NAME + mapKey,
                    getMapByKey(storage, mapKey),
                );
        });
        _pushStoreValueEvent(storage, path, updatedParams, prevValues);
        storageAction<any>(StorageType.P, options, storage.s);
    }
};
