import { getGlobalData } from "../global/get";
import {
    ArrayMapKey,
    capitalizeName,
    concat,
    isArray,
    isDefaultObject,
    isOptionalPathName,
    OptionalKey,
    signSplit,
} from "../utils";
import { getMapByKey, setMap } from "./utils";

export const generateStaticPathsMap = (
    path: string,
    prevPath: string[] = [path],
    data = getGlobalData(prevPath),
): any => {
    const pathName = capitalizeName(path);
    if (isDefaultObject(data)) {
        for (const name in data) {
            setMap(pathName + capitalizeName(name), prevPath);
            generateStaticPathsMap(
                pathName + capitalizeName(name),
                concat(prevPath, name),
                data[name],
            );
        }
    }

    setMap(pathName, prevPath);
};

export const patchToGlobalMap = (
    mapKey: string,
    baseMap: string = mapKey,
    staticPath?: string[],
    prevPath: string[] = [],
) => {
    if (!isOptionalPathName(mapKey)) return;
    const [staticName, firstKey, ...additionalKeys] = signSplit(mapKey);

    const staticFromMap = staticPath || getMapByKey(staticName) || [];
    const length = additionalKeys.length;

    if (isArray(getGlobalData(concat(staticFromMap, prevPath)))) {
        setMap(
            baseMap,
            concat(
                staticFromMap,
                prevPath,
                ArrayMapKey,
                firstKey,
                additionalKeys,
            ),
        );

        return;
    }
    setMap(baseMap, concat(staticFromMap, prevPath, firstKey));

    if (length) {
        patchToGlobalMap(
            OptionalKey + additionalKeys.join(OptionalKey),
            baseMap,
            staticFromMap,
            concat(prevPath, firstKey),
        );
    }
};
