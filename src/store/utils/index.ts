import { getMap } from "../maps/utils";
import { Maybe } from "../types";
import { StorageType } from "../types/store";

export type updatedParams = string | updatedParams[];
export const Mutators = "mutators";
export const ArrayMapKey = "[]";
export const OptionalKey = "$";
export const signSplit = (value: string) => value.split(/[\s$]+/);

export const pathToString = (path: string[]) => path.join("");

export const getRootPaths = (paths: string[]) =>
    paths.reduce(
        (prev, val, idx) =>
            concat(prev, [concat((prev && prev[idx - 1]) || [], val)]),
        [] as string[][],
    );

export const getUpdatedPaths = <T>(
    updatedParams: object,
    prevValues: object,
    paths: string[],
    res: string[][] = [],
) => {
    if (isObject(updatedParams)) {
        for (const key in assign({}, prevValues || {}, updatedParams)) {
            const propName = paths ? concat(paths, key) : [key];
            if (isObject(updatedParams[key])) {
                const updated = createCopy(updatedParams[key]);
                const prev = createCopy(prevValues[key] || {});

                if (updated !== prev) {
                    res.push(propName);
                }
                getUpdatedPaths(updated, prev, propName, res);
            } else if (prevValues && prevValues[key] !== updatedParams[key]) {
                res.push(propName);
            }
        }
        return concat([paths], res);
    }

    return prevValues !== updatedParams ? [paths] : [];
};

export const getAdditionalPaths = (
    paths: string[],
    filter = isArrayPathName,
    type = 1,
) =>
    entries(getMap())
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

const getPrototypeOf = Object.getPrototypeOf;

export const defaultObjectProto = getPrototypeOf({});

export const isDefaultObject = (value: any) =>
    isObject(value) && defaultObjectProto === getPrototypeOf(value);

const mutate =
    (type: StorageType, val: any) => (fn: Record<StorageType, any>) =>
        fn[type](val);

export const createCopy = (value: any) =>
    isDefaultObject(value) ? mergeDeep(undefined, {}, value) : value;

export const concat = (target: any[] | string, ...arrays: any): any =>
    target.concat(...arrays);

const mergeMutate = (type: Maybe<StorageType>, target: any, source: any) =>
    type && isAFunction(target) ? target(mutate(type, source)) : source;

export const mergeDeep = (
    type: Maybe<StorageType>,
    target: any,
    ...sources: any
): any => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
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

export const getAdditionalKeys = (paths: string[]) =>
    getAdditionalPaths(paths, isOptionalPathName, 0) as string[];

export const createNewArrayValues = (
    keys: string[],
    prev: any,
    newValue: any,
    filterFunc?: Function,
) => {
    const l = keys.length - 1;

    if (isArray(prev) && l >= 0) {
        return prev.map((_prevVal: any) => {
            const prevVal = createCopy(_prevVal);
            if (isAFunction(filterFunc) && !filterFunc!(prevVal)) {
                return prevVal;
            }
            const e = keys[l],
                targetObj = keys.reduce(
                    (prev, key, idx) => (idx === l ? prev : prev[key]),
                    prevVal,
                );

            if (targetObj) {
                targetObj[e] = getParams(newValue, targetObj[e]);
            }
            return prevVal;
        });
    }
    return prev;
};

export const findPathArrayIndex = (array?: string[]) =>
    (array && array.findIndex((val) => val === ArrayMapKey)) || -1;

export const isAFunction = (value: any) => typeof value === "function";

export const getParams = (params: any, ...args: any[]) =>
    isAFunction(params) ? params(...args) : params;

export const getFiltred = (params: any, filterFunc: any) =>
    isAFunction(filterFunc) ? params.filter(filterFunc) : params;

export const stringify = (value: any) => {
    try {
        return JSON.stringify(value);
    } catch {
        return;
    }
};

export const diffValues = (prevObject: any, newObject: any) =>
    diffValuesBoolean(prevObject, newObject) ? newObject : prevObject;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
    stringify(prevObject) !== stringify(newObject);

export const capitalizeName = (name: string) =>
    name && name[0].toUpperCase() + name.slice(1);

export const capitalizeKeysToString = (arr: string[]) =>
    pathToString(arr.map(capitalizeName));

export const assign = Object.assign;

export const entries = Object.entries;

export const isArrayPathName = (name: string | string[]) =>
    name.includes(ArrayMapKey);
export const isOptionalPathName = (name: string | string[]) =>
    name.includes(OptionalKey);
