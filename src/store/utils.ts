import { getMap } from "./maps/utils";
import { Maybe } from "./types";
import { IStore, StorageType } from "./types/store";

export type updatedParams = string | updatedParams[];
export const Mutators = "mutators";
export const isClient = typeof window !== "undefined" && window;
export const SignRegExp = /[\s$]+/;

export const pathToString = (path: string[]) => path.join("");

export const getRootPaths = (paths: string[]) =>
    paths.reduce(
        (prev, val, idx) =>
            prev.concat([((prev && prev[idx - 1]) || []).concat(val)]),
        [] as string[][],
    );

export const getUpdatedPaths = <T extends IStore>(
    updatedParams: T,
    prevValues: T,
    paths: string[],
    res: string[][] = [],
) => {
    if (isObject(updatedParams)) {
        for (const key in assign({}, prevValues || {}, updatedParams)) {
            const propName = paths ? paths.concat(key) : [key];
            if (key === Mutators) {
                continue;
            }
            if (isObject(updatedParams[key])) {
                const updated = assign({}, updatedParams[key] || {});
                const prev = assign({}, (prevValues[key] as IStore) || {});
                if (updated !== prev) {
                    res.push(propName);
                }
                getUpdatedPaths(updated, prev, propName, res);
            } else {
                if (prevValues[key] !== updatedParams[key]) {
                    res.push(propName);
                }
            }
        }
        return [paths].concat(res);
    }

    return prevValues !== updatedParams ? [paths] : [];
};

export const isObject = (value: any) =>
    value && typeof value === "object" && !Array.isArray(value);

const getPrototypeOf = Object.getPrototypeOf;

export const defaultObjectProto = getPrototypeOf({});

export const isDefaultObject = (value: any) =>
    isObject(value) && defaultObjectProto === getPrototypeOf(value);

const mutate =
    (type: StorageType, val: any) => (fn: Record<StorageType, any>) =>
        fn[type](val);

type TMergeArgs = [Maybe<StorageType>, ...any];

export function mergeDeep(...args: TMergeArgs): any {
    const [type, target, ...sources] = args as TMergeArgs;
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (key === Mutators) continue;
            if (isObject(source[key])) {
                if (!target[key]) assign(target, { [key]: {} });
                if (!isDefaultObject(source[key])) {
                    target[key] =
                        type && isAFunction(target[key])
                            ? target[key](mutate(type, source[key]))
                            : source[key];
                } else {
                    Reflect.apply(mergeDeep, null, [
                        type,
                        target[key],
                        source[key],
                    ]);
                }
            } else {
                assign(target, {
                    [key]:
                        type && isAFunction(target[key])
                            ? target[key](mutate(type, source[key]))
                            : source[key],
                });
            }
        }
    }
    return Reflect.apply(mergeDeep, null, [type, target].concat(sources));
}

export const getAdditionalPaths = (
    paths: string[],
    filter: Function,
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

export const getAdditionalKeys = (paths: string[], filter: Function) =>
    getAdditionalPaths(paths, filter, 0) as string[];

export const createNewArrayValues = (
    keys: string[],
    prev: any,
    newValue: any,
    filterFunc?: Function,
) => {
    const l = keys.length - 1;
    if (Array.isArray(prev) && l >= 0) {
        return prev.map((prevVal) => {
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
            return assign({}, prevVal);
        });
    }
    return prev;
};

export const findPathArrayIndex = (array?: string[]) =>
    (array && array.findIndex((val) => val === "[]")) || -1;

export const isAFunction = (value: any) => typeof value === "function";

export const getParams = (params: any, prev: any) =>
    isAFunction(params) ? params(prev) : params;

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
    name.charAt(0).toUpperCase() + name.slice(1);

export const capitalizeKeysToString = (arr: string[], ignoreFirst?: boolean) =>
    pathToString(
        arr.map((k, i) => (!i && ignoreFirst ? k : capitalizeName(k))),
    );

export const assign = Object.assign;

export const entries = Object.entries;

export const values = Object.values;

export const isNotMutator = (keyName: string) =>
    keyName !== capitalizeName(Mutators);

export const isArrayPathName = (name: string | string[]) => name.includes("[]");
export const isOptionalPathName = (name: string | string[]) =>
    name.includes("$");

export const generateId = (object: any, key?: string) => {
    if (key) return "#".concat(key).replace("$", "#");

    const { mapId } = EStorage;
    const value = isObject(object) ? object : { object };
    if (!mapId.has(value)) {
        mapId.set(value, ++EStorage.storeId);
    }
    return "#".concat(String(mapId.get(value)));
};
