import { PATH_MAP_EV_NAME, PUSH_EV_NAME, sendEvent } from "../events";
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
    getPaths,
    isOptionalPathName,
    mergeDeep,
    pathToString,
} from "../utils";
import { EStorage } from ".";

export const updateGlobalData = (
    src: Record<string, any>,
    [path, ...rest]: string[],
    data?: any,
): any =>
    !rest[0]
        ? (src[path] = createCopy(data))
        : (!src[path] && (src[path] = {}),
          updateGlobalData(src[path], rest, data));

export const updateStore = <T>(
    storage: EStorage,
    path: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    options?: Options<T>,
    type: UpdateType = UpdateType.S,
    update = true,
    prevValues = getGlobalData(storage.s, path),
    updatedParams = getParams(params, prevValues),
) =>
    path &&
    (updateGlobalData(
        storage,
        concat(["s"], path),
        type === UpdateType.P
            ? mergeDeep(undefined, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (getAdditional<string[]>(storage, path, isOptionalPathName, 0).forEach(
            (mapKey) => {
                const prevPath = getMapByKey(storage, mapKey);
                patchToGlobalMap(storage, mapKey);
                diffValuesBoolean(prevPath, getMapByKey(storage, mapKey)) &&
                    sendEvent(
                        PATH_MAP_EV_NAME + mapKey,
                        getMapByKey(storage, mapKey),
                    );
            },
        ),
        getPaths(storage, path, updatedParams, prevValues).every(
            (pathVal: string[]) =>
                sendEvent(
                    PUSH_EV_NAME + storage.id + pathToString(pathVal),
                    getGlobalData(storage.s, pathVal),
                ),
        ),
        storageAction<any>(StorageType.P, options, storage.s)));
