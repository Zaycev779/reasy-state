import { EStorage } from "../global";
import { getGlobalData } from "../global/get";
import {
    ArrayMapKey,
    assign,
    capitalizeName,
    concat,
    isArray,
    isDefaultObject,
    isOptionalPathName,
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
    isArr = isArray(getGlobalData(storage.s, base)),
    c = concat(base, keys[0]),
) =>
    isOptionalPathName(mapKey) &&
    ((storage.m[mapKey] = isArr ? concat(base, ArrayMapKey, keys) : c),
    !isArr && keys[1] && patchToGlobalMap(storage, mapKey, keys, c));
