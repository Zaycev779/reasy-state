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
    OptionalKey,
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
    baseMap: string = mapKey,
    staticPath?: string[],
    prevPath: string[] = [],
    [staticName, firstKey, ...additionalKeys] = split(mapKey),
    staticFromMap = staticPath || storage.m[staticName] || [],
    c = concat(staticFromMap, prevPath),
    isArr = isArray(getGlobalData(storage.s, c)),
): any =>
    isOptionalPathName(mapKey) &&
    ((storage.m[baseMap] = isArr
        ? concat(c, ArrayMapKey, firstKey, additionalKeys)
        : concat(c, firstKey)),
    !isArr &&
        additionalKeys[0] &&
        patchToGlobalMap(
            storage,
            OptionalKey + additionalKeys.join(OptionalKey),
            baseMap,
            staticFromMap,
            concat(prevPath, firstKey),
        ));
