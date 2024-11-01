import { PATH_MAP_EV_NAME, PUSH_EV_NAME } from "../events";
import { getGlobalData } from "./get";
import { patchToGlobalMap } from "../maps/maps";
import { storageAction } from "../storage";
import { EStorage, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    diffValuesBoolean,
    getAdditional,
    getParams,
    getPaths,
    isClient,
    mergeDeep,
    OptionalKey,
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
    update = isClient,
    prevValues = getGlobalData(storage, path),
    updatedParams = getParams(params, prevValues),
    sendEvent = (route: string) =>
        dispatchEvent(new CustomEvent(storage.id + route)),
) => (
    updateGlobalData(
        storage,
        concat(["s"], path),
        type === UpdateType.P
            ? mergeDeep(0, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (getAdditional<string[]>(
            storage,
            path,
            OptionalKey,
            ([mapKey, prevPath]) => (
                patchToGlobalMap(storage, mapKey),
                diffValuesBoolean(prevPath, storage.m[mapKey]) &&
                    sendEvent(PATH_MAP_EV_NAME + mapKey)
            ),
        ),
        getPaths(storage, path, updatedParams, prevValues).every(
            (pathVal: string[]) => sendEvent(PUSH_EV_NAME + pathVal),
        ),
        storageAction<any>(StorageType.P, storage.o, storage.s))
);
