import { getGlobalData } from "../global/get";
import {
    ArrayMapKey,
    capitalizeName,
    entries,
    isDefaultObject,
    isNotMutator,
    isOptionalPathName,
    OptionalKey,
    SignRegExp,
} from "../utils";
import { getMapByKey, setMap } from "./utils";

export const generateStaticPathsMap = (
    data: any,
    path: string,
    prevPath: string[] = [path],
): any => {
    const pathName = capitalizeName(path);
    if (isDefaultObject(data)) {
        setMap(pathName, prevPath);
        entries(data).forEach(([name, val]) => {
            const keyName = capitalizeName(name);
            if (isNotMutator(keyName)) {
                setMap(pathName + keyName, prevPath);
                generateStaticPathsMap(
                    val,
                    pathName + keyName,
                    prevPath.concat(name),
                );
            }
        });
    }

    setMap(pathName, prevPath);
    return data;
};

export const patchToGlobalMap = (
    mapKey: string,
    baseMap: string = mapKey,
    staticPath?: string[],
    prevPath: string[] = [],
) => {
    if (!isOptionalPathName(mapKey)) return;
    const [staticName, firstKey, ...additionalKeys] = mapKey.split(SignRegExp);

    const staticFromMap = staticPath || getMapByKey(staticName) || [];
    const length = additionalKeys.length;

    if (Array.isArray(getGlobalData(staticFromMap.concat(prevPath)))) {
        setMap(
            baseMap,
            staticFromMap.concat(
                prevPath,
                ArrayMapKey,
                firstKey,
                length ? additionalKeys : [],
            ),
        );
        return;
    }
    setMap(baseMap, staticFromMap.concat(prevPath, firstKey));

    if (length) {
        patchToGlobalMap(
            OptionalKey.concat(additionalKeys.join(OptionalKey)),
            baseMap || mapKey,
            staticFromMap,
            prevPath.concat(firstKey),
        );
    }
};
