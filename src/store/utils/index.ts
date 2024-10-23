import { EStorage } from "../global";
import { Maybe } from "../types";
import { StorageType } from "../types/store";

export type updatedParams = string | updatedParams[];
export const Mutators = "mutators";
export const ArrayMapKey = "[]";
export const OptionalKey = "$";
export const split = (value: string, type = /[\s$]+/) => value.split(type);
export const pathToString = (path: string[]) => path.join("");
export const { assign, entries, getPrototypeOf } = Object;
export const { stringify, parse } = JSON;

export const getRootPaths = (paths: string[]) =>
    paths.reduce(
        (prev, val, idx) =>
            concat(prev, [concat((prev && prev[idx - 1]) || [], val)]),
        [] as string[][],
    );

export const getUpdatedPaths = <T extends object>(
    updatedParams: T,
    prevValues: T,
    paths: string[] = [],
    res: string[][] = [paths],
) => {
    if (!isObject(updatedParams))
        return prevValues !== updatedParams ? [paths] : [];

    for (let key in assign({}, prevValues, updatedParams))
        ((isObject(updatedParams[key]) &&
            getUpdatedPaths(
                updatedParams[key] as object,
                prevValues[key] || {},
                concat(paths, key),
                res,
            )) ||
            (prevValues && prevValues[key] !== updatedParams[key])) &&
            res.push(concat(paths, key));
    return res;
};

export const getAdditional = (
    storage: EStorage,
    paths: string[],
    filter = isArrayPathName,
    type = 1,
) =>
    entries(storage.m)
        .filter(
            (entry) =>
                pathToString(entry[1]).startsWith(pathToString(paths)) &&
                entry[1].length > paths.length &&
                filter(entry[type]),
        )
        .map((entrie) => entrie[type]);

export const isObject = (value: any) =>
    value && typeof value === "object" && !isArray(value);

export const isArray = (value: any) => Array.isArray(value);

const defaultObjectProto = getPrototypeOf({});

export const isDefaultObject = (value: any) =>
    isObject(value) && defaultObjectProto === getPrototypeOf(value);

export const createCopy = (value: any) =>
    isDefaultObject(value) ? mergeDeep(undefined, {}, value) : value;

export const concat = (target: any[] | string, ...arrays: any): any =>
    target.concat(...arrays);

const mergeMutate = (type: Maybe<StorageType>, target: any, source: any) =>
    type && isAFunction(target)
        ? target((fn: Record<StorageType, any>) => fn[type](source))
        : source;

export const mergeDeep = (
    type: Maybe<StorageType>,
    target: any,
    source?: any,
    ...sources: any[]
): any => {
    if (!source && !sources.length) return target;

    if (isObject(target) && isObject(source)) {
        for (let key in source) {
            if (key === Mutators) continue;
            if (isObject(source[key])) {
                if (!target[key]) assign(target, { [key]: {} });
                if (!isDefaultObject(source[key])) {
                    target[key] = mergeMutate(type, target[key], source[key]);
                } else {
                    mergeDeep(type, target[key], source[key]);
                }
            } else {
                assign(target, {
                    [key]: mergeMutate(type, target[key], source[key]),
                });
            }
        }
    } else {
        target = mergeMutate(type, target, source);
    }
    return mergeDeep(type, target, ...sources);
};

export const generateArray = (
    keys: string[],
    prev: any,
    newValue: any,
    filterFunc: Function = () => 1,
    l = keys.length,
) =>
    isArray(prev) && l
        ? (prev as any[]).map(
              (_prevVal, _1, _2, prevVal = createCopy(_prevVal)) => {
                  filterFunc(prevVal) &&
                      keys.reduce(
                          (pr, key, idx) =>
                              pr &&
                              (pr[key] =
                                  idx + 1 === l
                                      ? getParams(newValue, pr[key])
                                      : isArray(pr[key])
                                      ? generateArray(
                                            slice(keys, idx + 1),
                                            pr[key],
                                            newValue,
                                        )
                                      : pr[key]),
                          prevVal,
                      );

                  return prevVal;
              },
          )
        : prev;

export const findPathArrayIndex = (array?: string[]) =>
    (array && array.findIndex((val) => val === ArrayMapKey) + 1) || 0;

export const slice = <T extends string | any[]>(
    value: T,
    start?: number,
    end?: number,
) => value.slice(start, end) as T;

export const isAFunction = (value: any) => typeof value === "function";

export const getParams = (params: any, ...args: any[]) =>
    isAFunction(params) ? params(...args) : params;

export const getFiltred = (params: any, filterFunc: any) =>
    isAFunction(filterFunc) ? params.filter(filterFunc) : params;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
    stringify(prevObject) !== stringify(newObject);

export const capitalizeName = (name: string) =>
    name && name[0].toUpperCase() + slice(name, 1);

export const capitalizeKeysToString = (arr: string[]) =>
    pathToString(arr.map(capitalizeName));

export const isArrayPathName = (name: string | string[]) =>
    name.includes(ArrayMapKey);
export const isOptionalPathName = (name: string | string[]) =>
    name.includes(OptionalKey);

export const reduceAssign = <T extends any>(
    store: T,
    value: (key: string, val: any) => any,
    init = {},
) =>
    entries(store || {}).reduce(
        (prev, entrie) => assign(prev, value(...entrie)),
        init,
    );
