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
import { getMapByKey } from "./utils";

export const getStaticPath = (
    store: any,
    id: string,
    path: string[] = [],
): Record<string, string[]> =>
    reduceAssign(
        store,
        (key, val, name = id + capitalizeName(key)) =>
            assign(
                { [name]: concat(path, key) },
                isDefaultObject(val) &&
                    getStaticPath(val, name, concat(path, key)),
            ),
        { [id]: path },
    );

export const patchToGlobalMap = (
    storage: EStorage,
    mapKey: string,
    baseMap: string = mapKey,
    staticPath?: string[],
    prevPath: string[] = [],
) => {
    if (isOptionalPathName(mapKey)) {
        const [staticName, firstKey, ...additionalKeys] = split(mapKey);
        const staticFromMap =
                staticPath || getMapByKey(storage, staticName) || [],
            c = concat(staticFromMap, prevPath);
        const setMap = (value: string[]) => (storage.m[baseMap] = value);

        if (isArray(getGlobalData(storage.s, c)))
            setMap(concat(c, ArrayMapKey, firstKey, additionalKeys));
        else {
            setMap(concat(c, firstKey));
            additionalKeys[0] &&
                patchToGlobalMap(
                    storage,
                    OptionalKey + additionalKeys.join(OptionalKey),
                    baseMap,
                    staticFromMap,
                    concat(prevPath, firstKey),
                );
        }
    }
};
