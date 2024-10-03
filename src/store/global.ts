import { _pushStoreValueEvent, _updatePathEvent, SET_EV_NAME } from "./events";
import { getGlobalData } from "./get-global";
import { patchToGlobalMap } from "./maps/maps";
import { getMapByKey } from "./maps/utils";
import { IStore, UpdateType } from "./types/store";
import {
    diffValuesBoolean,
    getAdditionalMapKeys,
    getParams,
    isClient,
    isObject,
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
    if (isClient) {
        const onLoad = () => {
            const onTargetEvent = (ev: Event) => {
                const { detail } = ev as CustomEvent<{
                    path: string[];
                    params:
                        | Partial<IStore>
                        | ((prev: IStore) => Partial<IStore>);
                    type: UpdateType;
                }>;
                const { params, path, type } = detail;
                const prevValues = getGlobalData(path);
                const updatedParams = getParams(params, prevValues);
                updateGlobalData(
                    path,
                    type === "patch" &&
                        isObject(updatedParams) &&
                        isObject(prevValues)
                        ? mergeDeep({}, prevValues, updatedParams)
                        : updatedParams,
                );

                const updatePathMaps = getAdditionalMapKeys(path);

                updatePathMaps.forEach((mapKey) => {
                    const prevPath = getMapByKey(mapKey);
                    patchToGlobalMap(mapKey);
                    if (diffValuesBoolean(prevPath, getMapByKey(mapKey))) {
                        _updatePathEvent(mapKey, getMapByKey(mapKey));
                    }
                });
                _pushStoreValueEvent(path, updatedParams, prevValues);
            };

            document.addEventListener(SET_EV_NAME, onTargetEvent);
        };
        if (document.readyState !== "loading") {
            onLoad();
        } else {
            window.addEventListener("DOMContentLoaded", () => onLoad);
        }
    }
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
