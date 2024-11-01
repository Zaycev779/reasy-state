import { PATH_MAP_EV_NAME, PUSH_EV_NAME, sendEvent } from "../events";
import { getGlobalData } from "./get";
import { patchToGlobalMap } from "../maps/maps";
import { storageAction } from "../storage";
import { EStorage, Options, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    diffValuesBoolean,
    getAdditional,
    getParams,
    getPaths,
    mergeDeep,
    OptionalKey,
    pathToString,
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
    options: Options<T>,
    params?: Partial<T> | ((prev: T) => Partial<T>),
    type: ValueOf<typeof UpdateType> = UpdateType.S,
    update = true,
    prevValues = getGlobalData(storage, path),
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
        (getAdditional<string[]>(
            m,
            path,
            OptionalKey,
            ([mapKey, prevPath]) => (
                patchToGlobalMap(storage, mapKey),
                diffValuesBoolean(prevPath, m[mapKey]) &&
                    sendEvent(PATH_MAP_EV_NAME + id + mapKey)
            ),
        ),
        getPaths(m, path, updatedParams, prevValues).every(
            (pathVal: string[]) =>
                sendEvent(PUSH_EV_NAME + id + pathToString(pathVal)),
        ),
        storageAction<any>(StorageType.P, options, storage.s))
);
