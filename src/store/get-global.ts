import { IStore } from "./types/store";
import { isArrayPathName } from "./utils";

export const getGlobalBySrc = (path: string[], storeId: string, src: any) =>
    getGlobalData(path, true, undefined, {
        [storeId]: src,
    });

export const getGlobalData = (
    path?: string[],
    forArray?: boolean,
    filterFunc?: () => void,
    src = EStorage.store,
) =>
    path
        ? (path.reduce(
              (prev, v, idx) => {
                  if (prev.skip) {
                      return prev;
                  }
                  const { value } = prev;
                  const isArray = Array.isArray(value);
                  if (isArrayPathName(v) || isArray) {
                      if (forArray) {
                          const additionalPaths = path.slice(idx + 1);
                          const filterValue = filterFunc
                              ? isArray
                                  ? value.filter(filterFunc)
                                  : undefined
                              : value;
                          return {
                              value:
                                  filterValue &&
                                  filterValue.map(
                                      (v: any) =>
                                          additionalPaths &&
                                          additionalPaths.reduce(
                                              (prev, key) => prev && prev[key],
                                              v,
                                          ),
                                  ),
                              skip: true,
                          };
                      }
                      return {
                          value,
                          skip: true,
                      };
                  }
                  return { value: value && value[v] };
              },
              { value: src } as { value?: Record<string, any>; skip?: boolean },
          ).value as Partial<IStore>)
        : {};
