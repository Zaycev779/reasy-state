import { Maybe, ValueOf } from "../types";
import { StorageType } from "../types/store";

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

export const isDefaultObject = (value: any) =>
    value && value.constructor === object;

export const createCopy = (value: any, prev: any = {}) =>
    isDefaultObject(value) ? mergeDeep(0, prev, value) : value;

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
                    mergeDeep(
                        type,
                        (target[key] = target[key] || {}),
                        source[key],
                    );
                } else {
                    target[key] = mergeMutate(type, target[key], source[key]);
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
    filterFunc?: Function,
) =>
    isArray(prev)
        ? (prev as any[]).map(
              (_prevVal, _1, _2, prevVal = createCopy(_prevVal)) => {
                  (!filterFunc || filterFunc(prevVal)) &&
                      keys.reduce(
                          (pr, key, idx) =>
                              pr &&
                              (pr[key] = keys[idx + 1]
                                  ? generateArray(
                                        slice(keys, idx + 1),
                                        pr[key],
                                        newValue,
                                    )
                                  : getParams(newValue, pr[key])),
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

export const isAFunction = (value: any) => typeof value === typeof isAFunction;

export const getParams = (params: any, ...args: any[]) =>
    isAFunction(params) ? params(...args) : params;

export const capitalizeName = (name: string) =>
    name && name[0].toUpperCase() + slice(name, 1);

export const capitalizeKeysToString = (arr: string[]) =>
    arr.map(capitalizeName).join(EmptyPath);

export const isPathNameType = (name: string | string[], t = ArrayMapKey) =>
    name.indexOf(t) + 1;

export const reduceAssign = <T extends any>(
    store: T = {} as T,
    value: (key: string, val: any) => any,
    init = {},
) =>
    entries<T>(store as any).reduce(
        (prev, entrie) => assign(prev, value(...entrie)),
        init,
    );
