import { getGlobalData } from "./get";
import { storageAction } from "../storage";
import { EStorage, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    getParams,
    isClient,
    mergeDeep,
    getUpdatedPaths,
    slice,
    getFiltred,
    entries,
    EmptyPath,
    OptionalKey,
    isPathNameType,
    diffValuesBoolean,
    PATH_MAP_EV_NAME,
} from "../utils";
import { ValueOf } from "../types";
import { patchToGlobalMap } from "../maps/maps";

export const updateGlobalData = (
    src: Record<string, any>,
    [path, ...rest]: string[],
    data?: any,
): any =>
    rest[0]
        ? (!src[path] && (src[path] = {}),
          updateGlobalData(src[path], rest, data))
        : (src[path] = createCopy(data));

export const updateStore = <T>(
    storage: EStorage,
    paths: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    type: ValueOf<typeof UpdateType> = UpdateType.S,
    update: 0 | boolean = isClient,
    prevValues = getGlobalData(storage, paths),
    updatedParams = getParams(params, prevValues),

    sendEvent = (route: string | string[]) =>
        dispatchEvent(new CustomEvent(storage.id + route)),
) => (
    updateGlobalData(
        storage,
        concat(["s"], paths),
        type === UpdateType.P
            ? mergeDeep(0, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (paths
            .reduce(
                (prev, _, idx) => concat(prev, [slice(paths, 0, idx)]),
                concat(
                    getUpdatedPaths(paths, updatedParams, prevValues),
                    getFiltred(
                        entries(storage.m),
                        ([mapKey, path]: [string, string[]]) =>
                            (EmptyPath + path).match(paths + ",") &&
                            (isPathNameType(mapKey, OptionalKey) &&
                                (patchToGlobalMap(storage, mapKey),
                                diffValuesBoolean(path, storage.m[mapKey]) &&
                                    sendEvent(PATH_MAP_EV_NAME + mapKey)),
                            isPathNameType(path)),
                    ).map((entrie: [string, string[]]) => entrie[1]),
                ) as string[][],
            )
            .every(sendEvent),
        storageAction<any>(StorageType.P, storage.o, storage.s))
);
