import { getGlobalData } from "../global/get";
import {
    ArrayMapKey,
    capitalizeName,
    concat,
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
        entries(data).forEach(([name, val]) => {
            const keyName = pathName + capitalizeName(name);
            if (isNotMutator(keyName)) {
                setMap(keyName, prevPath);
                generateStaticPathsMap(val, keyName, concat(prevPath, name));
            }
        });
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
    const [staticName, firstKey, ...additionalKeys] = mapKey.split(SignRegExp);

    const staticFromMap = staticPath || getMapByKey(staticName) || [];
    const length = additionalKeys.length;

    if (Array.isArray(getGlobalData(concat(staticFromMap, prevPath)))) {
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
