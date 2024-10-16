import { Storage } from "./index";
import { getFiltred, isArray, isArrayPathName } from "../utils";

export const getGlobalBySrc = (path: string[], storeId: string, src: any) =>
    getGlobalData(path, true, undefined, {
        [storeId]: src,
    });

export const getGlobalData = (
    path?: string[],
    forArray?: boolean,
    filterFunc?: () => void,
    src = Storage.store,
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
        path
            .slice(index)
            .reduce(
                (prev, key, idx) =>
                    prev &&
                    (isArray(prev)
                        ? arrayPathReduce(prev, path, index + idx)
                        : prev[key]),
                e,
            ),
    );
