import { getGlobalData } from "../global/get";
import { EStorage } from "../types/store";
import {
    ArrayMapKey,
    assign,
    capitalizeName,
    concat,
    isArray,
    isDefaultObject,
    reduceAssign,
    split,
} from "../utils";

export const getStaticPath = (
    store: any,
    prev: string = "",
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
    base = storage.m[root] || [],
    isArr = isArray(getGlobalData(storage, base)),
    c = concat(base, keys[0]),
): any =>
    keys[0] &&
    (storage.m[mapKey] = isArr
        ? concat(base, ArrayMapKey, keys)
        : keys[1]
        ? patchToGlobalMap(storage, mapKey, keys, c)
        : c);
