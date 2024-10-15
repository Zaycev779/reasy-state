import { Storage } from "./index";
import { IStore } from "../types/store";
import { isArrayPathName } from "../utils";

export const getGlobalBySrc = (path: string[], storeId: string, src: any) =>
    getGlobalData(path, true, undefined, {
        [storeId]: src,
    });

export const getGlobalData = (
    path?: string[],
    forArray?: boolean,
    filterFunc?: () => void,
    src = Storage.store,
) =>
    path
        ? (path.reduce(
              (prev, rec, idx) => {
                  if (prev.s) {
                      return prev;
                  }
                  const { e } = prev;
                  const isArray = Array.isArray(e);
                  if (isArrayPathName(rec) || isArray) {
                      if (forArray) {
                          const additionalPaths = path.slice(idx + 1);
                          const filterValue = filterFunc
                              ? isArray && e.filter(filterFunc)
                              : e;
                          return {
                              e:
                                  filterValue &&
                                  filterValue.map(
                                      (e: any) =>
                                          additionalPaths &&
                                          additionalPaths.reduce(
                                              (prev, key) => prev && prev[key],
                                              e,
                                          ),
                                  ),
                              s: true,
                          };
                      }
                      return {
                          e,
                          s: true,
                      };
                  }
                  return { e: e && e[rec] };
              },
              { e: src } as { e?: Record<string, any>; s?: boolean },
          ).e as Partial<IStore>)
        : {};
