import { EStorage } from "./index";
import { getFiltred, isArray, isArrayPathName, slice } from "../utils";

export const getGlobalData = <T = EStorage["s"]>(
    src: T,
    path?: string[],
    forArray?: boolean,
    filterFunc?: () => void,
) => {
    if (!path) return {};
    for (let i = 0; i < path.length; i++) {
        if (isArrayPathName(path[i])) {
            if (forArray) {
                src =
                    isArray(src) &&
                    arrayPathReduce(getFiltred(src, filterFunc), path, i + 1);
            }
            break;
        }
        src = src && src[path[i]];
    }
    return src;
};

const arrayPathReduce = (value: any[], path: string[], index: number): any =>
    value.flatMap((e: any) =>
        slice(path, index).reduce(
            (prev, key, idx) =>
                prev &&
                (isArray(prev)
                    ? arrayPathReduce(prev, path, index + idx)
                    : prev[key]),
            e,
        ),
    );
