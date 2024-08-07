import { globalStoreMap } from './global';
import { IStore } from './types/store';

export type updatedParams = string | updatedParams[];

export const getUpdatedParams = <T extends IStore>(
  updatedParams: T,
  prevValues: T,
  paths: string[]
): updatedParams[] => {
  if (!isObject(updatedParams)) return [];
  const entries = Object.entries(updatedParams);
  return entries.reduce((prev, [key, val]) => {
    if (key === 'mutators') return prev;
    let childParam: updatedParams[] = [];
    if (isObject(val)) {
      childParam = [
        getUpdatedParams(val as IStore, prevValues[key] as IStore, paths),
      ];
    }
    if (val !== prevValues[key]) {
      return prev.concat(
        ([key] as updatedParams[]).concat(childParam.length ? childParam : [])
      );
    }
    return prev;
  }, [] as updatedParams[]);
};

export const getUpdatePaths = (keys: updatedParams[], paths: string[]) => {
  const updatePaths: string[][] = [];
  if (paths) {
    const pathsArr = paths.reduce(
      (prev, val, idx) => prev.concat([(prev?.[idx - 1] || []).concat(val)]),
      [] as string[][]
    );
    updatePaths.push(...pathsArr);
  }

  const flattenPaths = (
    keys: updatedParams[],
    prevPaths: string[],
    basePath: string[]
  ) => {
    keys.forEach((val) => {
      if (Array.isArray(val)) {
        flattenPaths(
          val,
          prevPaths.concat(
            keys.filter((v) => typeof v === 'string') as string[]
          ),
          basePath
        );
      } else {
        updatePaths.push((basePath || []).concat(prevPaths, val));
      }
    });
  };
  flattenPaths(keys, [], paths);
  return updatePaths;
};

export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: any, ...sources: any): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const getAdditionalPaths = (paths: string[]) => {
  const storeMap = Object.values(globalStoreMap) as string[][];
  return paths
    .reduce((prev, path, idx) => {
      const curVal = prev.filter(
        (curVal) => curVal?.[idx] === path && curVal.length > paths.length
      );
      return curVal;
    }, storeMap)
    .filter((v) => v.includes('[]'));
};

export const createNewArrayValues = (
  keys: string[],
  prev: any,
  newValue: any,
  filterFunc?: Function
) => {
  const l = keys.length - 1;
  if (Array.isArray(prev) && l >= 0) {
    return prev.map((prevVal) => {
      if (isAFunction(filterFunc) && !filterFunc?.(prevVal)) {
        return prevVal;
      }
      const e = keys[l],
        targetObj = keys.reduce((prev, key, idx) => {
          return idx === l ? prev : prev[key];
        }, prevVal);

      if (targetObj) {
        targetObj[e] = getParams(newValue, targetObj[e]);
      }
      return Object.assign({}, prevVal);
    });
  }
  return prev;
};

export const getAdditionalMapKeys = (paths: string[]) => {
  const storeMap = Object.keys(globalStoreMap) as string[],
    l = paths.length;

  return paths
    .reduce((prevName, path, idx) => {
      const curVal = prevName.filter((val) => {
        const pathMap = globalStoreMap[val];
        return pathMap[idx] === path && pathMap.length > l;
      });
      return curVal;
    }, storeMap)
    .filter((val) => val.includes('$'));
};

export const isAFunction = (value: any) => typeof value === 'function';
export const getParams = (params: any, prev: any) =>
  isAFunction(params) ? params(prev) : params;

export const diffValues = (prevObject: any, newObject: any) =>
  diffValuesBoolean(prevObject, newObject) ? newObject : prevObject;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
  JSON.stringify(prevObject) !== JSON.stringify(newObject);

export const capitalizeName = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1);

export const capitalizeKeysToString = (arr: string[], ignoreFirst?: boolean) =>
  arr.map((k, i) => (!i && ignoreFirst ? k : capitalizeName(k))).join('');
