import { getGlobalData } from "./get";
import { storageAction } from "../storage";
import { EStorage, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    getParams,
    updatePaths,
    isClient,
    mergeDeep,
    getUpdatedPaths,
} from "../utils";
import { ValueOf } from "../types";

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
    path: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    type: ValueOf<typeof UpdateType> = UpdateType.S,
    update: 0 | boolean = isClient,
    prevValues = getGlobalData(storage, path),
    updatedParams = getParams(params, prevValues),
) => (
    updateGlobalData(
        storage,
        concat(["s"], path),
        type === UpdateType.P
            ? mergeDeep(0, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (updatePaths(
            storage,
            path,
            getUpdatedPaths(path, updatedParams, prevValues),
        ),
        storageAction<any>(StorageType.P, storage.o, storage.s))
);
