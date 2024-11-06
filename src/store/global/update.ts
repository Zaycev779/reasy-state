import { getGlobalData } from "./get";
import { storageAction } from "../storage";
import { EStorage, StorageType, UpdateType } from "../types/store";
import {
    concat,
    createCopy,
    getParams,
    isClient,
    mergeDeep,
    entries,
    OptionalKey,
    isPathNameType,
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
) => (
    updateGlobalData(
        storage,
        concat(["s"], paths),
        type === UpdateType.P
            ? mergeDeep(0, {}, prevValues, updatedParams)
            : updatedParams,
    ),
    update &&
        (entries(storage.m).map(
            ([mapKey, path, p = path + ",", d = paths + ","]: [
                string,
                string[],
                ...any,
            ]) =>
                (d.match(p) ||
                    (p.match(d) &&
                        (isPathNameType(mapKey, OptionalKey) &&
                            patchToGlobalMap(storage, mapKey),
                        1))) &&
                dispatchEvent(new CustomEvent(storage.id + mapKey)),
        ),
        storageAction<any>(storage.o, storage.s, StorageType.P))
);
