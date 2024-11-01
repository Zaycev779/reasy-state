import { EStorage } from "../types/store";
import { getFiltred, isArray, isPathNameType, slice } from "../utils";

export const getGlobalData = <T extends EStorage>(
    { s: src }: T,
    path: string[],
    filterFunc?: () => void,
) => {
    path.every((p, i) =>
        isPathNameType(p)
            ? ((src = arrayPathReduce(
                  getFiltred(src, filterFunc),
                  slice(path, i + 1),
              )),
              0)
            : (src = src && src[p]),
    );
    return src;
};

const arrayPathReduce = (value: any[], path: string[]): any =>
    isArray(value)
        ? value.flatMap((e: any) =>
              path.reduce(
                  (prev, _, idx) =>
                      prev && arrayPathReduce(prev, slice(path, idx)),
                  e,
              ),
          )
        : value[path[0]];
