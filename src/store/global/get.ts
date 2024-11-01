import { EStorage } from "../types/store";
import { getFiltred, isArray, isPathNameType, slice } from "../utils";

export const getGlobalData = <T extends EStorage>(
    { s: src }: T,
    path: string[],
    filterFunc?: () => void,
) => {
    path.every((p, i) =>
        isPathNameType(p)
            ? ((src =
                  isArray(src) &&
                  arrayPathReduce(getFiltred(src, filterFunc), path, i + 1)),
              0)
            : (src = src && src[p]),
    );
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
