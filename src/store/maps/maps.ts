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
            const keyName = pathName + capitalizeName(name);
            setMap(keyName, prevPath);
            generateStaticPathsMap(keyName, concat(prevPath, name), data[name]);
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
                length ? additionalKeys : [],
            ),
        );

        return;
    }
    setMap(baseMap, concat(staticFromMap, prevPath, firstKey));

    if (length) {
        patchToGlobalMap(
            concat(OptionalKey, additionalKeys.join(OptionalKey)),
            baseMap || mapKey,
            staticFromMap,
            concat(prevPath, firstKey),
        );
    }
};
