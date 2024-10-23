import { EStorage } from "./index";
import { getFiltred, isArray, isArrayPathName, slice } from "../utils";

export const getGlobalData = <T extends EStorage["s"]>(
    src: T,
    path?: string[],
    forArray?: boolean,
    filterFunc?: () => void,
) => {
    if (!path) return {};
    path.every((p, i) => {
        if (isArrayPathName(p)) {
            if (forArray) {
                src =
                    isArray(src) &&
                    arrayPathReduce(getFiltred(src, filterFunc), path, i + 1);
            }
            return 0;
        }
        return (src = src && src[p]);
    });
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
