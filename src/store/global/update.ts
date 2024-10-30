import { PATH_MAP_EV_NAME, PUSH_EV_NAME, sendEvent } from "../events";
import { getGlobalData } from "./get";
import { patchToGlobalMap } from "../maps/maps";
import { storageAction } from "../storage";
import { Options, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    diffValuesBoolean,
    getAdditional,
    getParams,
    getPaths,
    isOptionalPathName,
    mergeDeep,
    pathToString,
} from "../utils";
import { EStorage } from ".";
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
    options: Options<T>,
    params?: Partial<T> | ((prev: T) => Partial<T>),
    type: ValueOf<typeof UpdateType> = UpdateType.S,
    update = true,
    prevValues = getGlobalData(storage.s, path),
    updatedParams = getParams(params, prevValues),
    { id, m } = storage,
) => (
    updateGlobalData(
        storage,
        concat(["s"], path),
        type === UpdateType.P
            ? mergeDeep(0, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (getAdditional<string[]>(m, path, isOptionalPathName, 0, ([mapKey]) => {
            const prevPath = m[mapKey];
            patchToGlobalMap(storage, mapKey);
            diffValuesBoolean(prevPath, m[mapKey]) &&
                sendEvent(PATH_MAP_EV_NAME + id + mapKey);
        }),
        getPaths(m, path, updatedParams, prevValues).every(
            (pathVal: string[]) =>
                sendEvent(PUSH_EV_NAME + id + pathToString(pathVal)),
        ),
        storageAction<any>(StorageType.P, options, storage.s))
);
