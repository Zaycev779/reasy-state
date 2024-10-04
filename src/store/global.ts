import { _pushStoreValueEvent, _updatePathEvent } from "./events";
import { getGlobalData } from "./get-global";
import { patchToGlobalMap } from "./maps/maps";
import { getMapByKey } from "./maps/utils";
import { IStore, UpdateType } from "./types/store";
import {
    diffValuesBoolean,
    getAdditionalKeys,
    getParams,
    isObject,
    isOptionalPathName,
    mergeDeep,
} from "./utils";

declare global {
    namespace EStorage {
        let store: Record<string, any>;
        let map: Record<string, string[]>;
        let storeId: number;
        const mapId: WeakMap<object, number>;
    }
}

if (!("EStorage" in globalThis)) {
    globalThis.EStorage = {
        store: {},
        map: {},
        storeId: 0,
        mapId: new WeakMap(),
    };
}

export const updateGlobalData = (
    paths: string[],
    data: Partial<IStore>,
    src: Record<string, any> = getGlobalData([]),
) => {
    const [path, ...rest] = paths;
    if (!rest.length) {
        try {
            const cloneData = isObject(data) ? mergeDeep({}, data) : data;
            src[path] = cloneData;
        } catch {
            src[path] = data;
        }
        return true;
    }
    if (!src[path]) {
        src[path] = {};
    }
    updateGlobalData(rest, data, src[path]);
};

export const updateStore = <T>(
    path: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    type: UpdateType = "set",
) => {
    const prevValues = getGlobalData(path);
    const updatedParams = getParams(params, prevValues);
    updateGlobalData(
        path,
        type === "patch" && isObject(updatedParams) && isObject(prevValues)
            ? mergeDeep({}, prevValues, updatedParams)
            : updatedParams,
    );

    const updatePathKeys = getAdditionalKeys(path, isOptionalPathName);

    updatePathKeys.forEach((mapKey) => {
        const prevPath = getMapByKey(mapKey);
        patchToGlobalMap(mapKey);
        if (diffValuesBoolean(prevPath, getMapByKey(mapKey))) {
            _updatePathEvent(mapKey, getMapByKey(mapKey));
        }
    });
    _pushStoreValueEvent(path, updatedParams, prevValues);
};
