import { Maybe, ValueOf } from "../types";
import { EStorage, StorageType } from "../types/store";

export const Mutators = "mutators";
export const ArrayMapKey = "*";
export const OptionalKey = "$";
export const EmptyPath = "";
export const split = (value: string, type: string | RegExp = OptionalKey) =>
    value.split(type);

export const object = Object;
export const { assign, entries } = object;
export const { stringify, parse } = JSON;
export const isArray = Array.isArray;
export const isClient = typeof window == "object";

export const getPaths = (
    storage: EStorage,
    paths: string[],
    updatedValues: any,
    prevValues: any,
) =>
    paths.reduce(
        (prev, _, idx) => concat(prev, [slice(paths, 0, idx)]),
        concat(
            getUpdatedPaths(paths, updatedValues, prevValues),
            getAdditional(storage, paths),
        ) as string[][],
    );

const getUpdatedPaths = <T extends Record<string, any>>(
    paths: string[],
    updatedParams: T,
    prevValues: T,
    res: string[][] = [paths],
): any => (
    isDefaultObject(updatedParams) &&
        entries(assign({}, prevValues, updatedParams)).every(
            ([key, val, c = concat(paths, key)]) =>
                getUpdatedPaths(c, val, prevValues && prevValues[key], res) &&
                res.push(c),
        ),
    res
);

export const getAdditional = <T>(
    storage: EStorage,
    paths: string[],
    pathNameType?: string,
    f: (e: [string, string[]]) => any = (entrie) => entrie[1],
) =>
    getFiltred(
        entries(storage.m),
        (entry: [string, string[]]) =>
            (EmptyPath + entry[1]).match(paths + ",") &&
            isPathNameType(entry[+!pathNameType], pathNameType),
    ).map(f) as T;

export const isDefaultObject = (value: any) =>
    value && value.constructor === object;

export const createCopy = (value: any) =>
    isDefaultObject(value) ? mergeDeep(0, {}, value) : value;

export const concat = (target: any[] | string, ...arrays: any): any =>
    target.concat(...arrays);

const mergeMutate = (
    type: Maybe<ValueOf<typeof StorageType>> | 0,
    target: any,
    source: any,
) =>
    type && isAFunction(target)
        ? target((fn: Record<ValueOf<typeof StorageType>, any>) =>
              fn[type](source),
          )
        : source;

export const mergeDeep = (
    type: Maybe<ValueOf<typeof StorageType>> | 0,
    target: any,
    source?: any,
    ...sources: any[]
): any => {
    if (!source && !sources.length) return target;

    if (isDefaultObject(target) && isDefaultObject(source)) {
        for (let key in source) {
            if (key !== Mutators) {
                if (isDefaultObject(source[key])) {
                    if (!target[key]) assign(target, { [key]: {} });
                    mergeDeep(type, target[key], source[key]);
                } else {
                    assign(target, {
                        [key]: mergeMutate(type, target[key], source[key]),
                    });
                }
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
) =>
    isArray(prev)
        ? (prev as any[]).map(
              (_prevVal, _1, _2, prevVal = createCopy(_prevVal)) => {
                  filterFunc(prevVal) &&
                      keys.reduce(
                          (pr, key, idx) =>
                              pr &&
                              (pr[key] =
                                  idx + 1 === keys.length
                                      ? getParams(newValue, pr[key])
                                      : generateArray(
                                            slice(keys, idx + 1),
                                            pr[key],
                                            newValue,
                                        )),
                          prevVal,
                      );

                  return prevVal;
              },
          )
        : prev;

export const slice = <T extends string | any[]>(
    value: T,
    start?: number,
    end?: number,
) => value.slice(start, end) as T;

const isAFunction = (value: any) => typeof value === typeof isAFunction;

export const getParams = (params: any, ...args: any[]) =>
    isAFunction(params) ? params(...args) : params;

export const getFiltred = (params: any, filterFunc: any) =>
    isAFunction(filterFunc) ? params.filter(filterFunc) : params;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
    stringify(prevObject) !== stringify(newObject);

export const capitalizeName = (name: string) =>
    name && name[0].toUpperCase() + slice(name, 1);

export const capitalizeKeysToString = (arr: string[]) =>
    arr.map(capitalizeName).join(EmptyPath);

export const isPathNameType = (name: string | string[], t = ArrayMapKey) =>
    name.includes(t);

export const reduceAssign = <T extends any>(
    store: T = {} as T,
    value: (key: string, val: any) => any,
    init = {},
) =>
    entries<T>(store as any).reduce(
        (prev, entrie) => assign(prev, value(...entrie)),
        init,
    );
