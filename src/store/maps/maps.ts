import { getGlobalData } from "../get-global";
import {
    capitalizeName,
    entries,
    isDefaultObject,
    isNotMutator,
    isOptionalPathName,
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
    const [staticName, firstKey, ...additionalKeys] =
        mapKey?.split(SignRegExp) ?? [];

    const staticFromMap = staticPath || getMapByKey(staticName) || [];
    const baseRequiredData = getGlobalData(staticFromMap.concat(prevPath));
    const length = additionalKeys.length;

    if (Array.isArray(baseRequiredData)) {
        setMap(
            baseMap,
            staticFromMap.concat(
                prevPath,
                "[]",
                firstKey,
                length ? additionalKeys : [],
            ),
        );
        return;
    }
    setMap(baseMap, staticFromMap.concat(prevPath, firstKey));

    if (length) {
        patchToGlobalMap(
            "$".concat(additionalKeys.join("$")),
            baseMap || mapKey,
            staticFromMap,
            prevPath.concat(firstKey),
        );
    }
};
