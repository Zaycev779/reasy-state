import { storageAction } from "../storage";
import { EStorage } from "../types/store";
import { createCopy, getParams, isClient, entries } from "../utils";
import { patchToGlobalMap } from "../maps/maps";

export const updateGlobalData = (
    src: Record<string, any>,
    path: string,
    [next, ...rest]: string[],
    data?: any,
    patch?: 0 | 1,
    target = src[path],
): any =>
    next
        ? updateGlobalData((src[path] = target || {}), next, rest, data, patch)
        : (src[path] = createCopy(getParams(data, target), patch && target));

export const updateStore = <T>(
    storage: EStorage,
    paths: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    patch?: 0 | 1,
    update: 0 | boolean = isClient,
) => (
    updateGlobalData(storage, "s", paths, params, patch),
    update &&
        (entries(storage.m).map(
            ([
                mapKey,
                path,
                p = path + ",",
                d = paths + ",",
                c = storage.c[mapKey],
            ]: [string, string[], ...any]) =>
                d.match(p) +
                    (p.match(d) && patchToGlobalMap(storage, mapKey)) &&
                c &&
                c.map(getParams),
        ),
        storageAction<any>(storage.o, storage.s))
);
