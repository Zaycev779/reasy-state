import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import {
    ArrayMapKey,
    assign,
    capitalizeName,
    concat,
    EmptyPath,
    isArray,
    isDefaultObject,
    reduceAssign,
    split,
} from "../utils";

export const getStaticPath = (
    store: any,
    prev: string = EmptyPath,
    path: string[] = [],
): Record<string, string[]> =>
    reduceAssign(
        store,
        (key, val, name = prev + capitalizeName(key), p = concat(path, key)) =>
            assign(
                { [name]: p },
                isDefaultObject(val) && getStaticPath(val, name, p),
            ),
        { [prev]: path },
    );

export const patchToGlobalMap = (
    storage: EStorage,
    mapKey: string,
    [root, ...keys] = split(mapKey),
    base = storage.m[root],
): any =>
    keys[0]
        ? (storage.m[mapKey] = isArray(getGlobalData(storage, base))
              ? concat(base, ArrayMapKey, keys)
              : patchToGlobalMap(storage, mapKey, keys, concat(base, keys[0])))
        : base;
